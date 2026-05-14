package com.group1.career.service.impl;

import com.group1.career.model.dto.CdutEmploymentInsightDto;
import com.group1.career.model.dto.UserProfileSnapshot;
import com.group1.career.model.entity.CdutEmploymentRecord;
import com.group1.career.model.entity.User;
import com.group1.career.repository.CdutEmploymentRecordRepository;
import com.group1.career.repository.UserRepository;
import com.group1.career.service.CdutEmploymentInsightService;
import com.group1.career.service.UserProfileSnapshotService;
import com.group1.career.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CdutEmploymentInsightServiceImpl implements CdutEmploymentInsightService {

    private static final String SCHOOL = "成都理工大学";
    private static final Duration CACHE_TTL = Duration.ofDays(14);
    private static final int SOURCE_LIMIT = 20;
    private static final String USER_AGENT = "Mozilla/5.0 CareerLoopBot/1.0 (+public CDUT employment insight)";
    private static final AtomicBoolean REFRESHING = new AtomicBoolean(false);
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private static final Pattern RATE_PATTERN = Pattern.compile("(?:就业率|去向落实率|落实率)[^0-9%]{0,24}(\\d{1,3}(?:\\.\\d{1,2})?)%");
    private static final Pattern POSTGRAD_PATTERN = Pattern.compile("(?:深造率|升学率)[^0-9%]{0,24}(\\d{1,3}(?:\\.\\d{1,2})?)%");
    private static final Pattern YEAR_PATTERN = Pattern.compile("(20\\d{2})");

    private final CdutEmploymentRecordRepository recordRepository;
    private final UserRepository userRepository;
    private final UserProfileSnapshotService snapshotService;

    @Override
    public CdutEmploymentInsightDto getInsightForCurrentUser() {
        Long uid = SecurityUtil.requireCurrentUserId();
        ensureRecentData();
        return buildInsight(uid);
    }

    @Override
    @Transactional
    public CdutEmploymentInsightDto refreshForCurrentUser() {
        Long uid = SecurityUtil.requireCurrentUserId();
        refreshSources();
        return buildInsight(uid);
    }

    private void ensureRecentData() {
        try {
            if (recordRepository.count() == 0 || recordRepository.countByFetchedAtAfter(LocalDateTime.now().minus(CACHE_TTL)) == 0) {
                refreshSources();
            }
        } catch (Exception e) {
            log.warn("[cdut-employment] best-effort refresh failed: {}", e.toString());
        }
    }

    private CdutEmploymentInsightDto buildInsight(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        UserProfileSnapshot snapshot = snapshotService.read(userId);
        String major = firstText(user == null ? null : user.getMajor(), "未填写专业");
        String targetRole = inferTargetRole(snapshot);
        List<CdutEmploymentRecord> all = recordRepository.findAllByOrderByYearDescFetchedAtDesc(PageRequest.of(0, SOURCE_LIMIT));
        List<ScoredRecord> scored = all.stream()
                .map(r -> new ScoredRecord(r, score(r, major, targetRole)))
                .sorted(Comparator.comparingInt(ScoredRecord::score).reversed()
                        .thenComparing(sr -> Optional.ofNullable(sr.record().getYear()).orElse(0), Comparator.reverseOrder()))
                .toList();

        List<CdutEmploymentRecord> selected = scored.stream()
                .filter(sr -> sr.score() > 0)
                .map(ScoredRecord::record)
                .limit(8)
                .collect(Collectors.toList());
        if (selected.isEmpty()) {
            selected = all.stream().limit(5).collect(Collectors.toList());
        }

        BigDecimal latestEmployment = selected.stream()
                .filter(r -> r.getEmploymentRate() != null)
                .max(Comparator.comparing(r -> Optional.ofNullable(r.getYear()).orElse(0)))
                .map(CdutEmploymentRecord::getEmploymentRate)
                .orElse(null);
        BigDecimal latestPostgrad = selected.stream()
                .filter(r -> r.getPostgraduateRate() != null)
                .max(Comparator.comparing(r -> Optional.ofNullable(r.getYear()).orElse(0)))
                .map(CdutEmploymentRecord::getPostgraduateRate)
                .orElse(null);
        Integer latestYear = selected.stream()
                .map(CdutEmploymentRecord::getYear)
                .filter(y -> y != null && y > 0)
                .max(Integer::compareTo)
                .orElse(null);

        List<String> metricHighlights = selected.stream()
                .filter(r -> r.getEmploymentRate() != null || r.getPostgraduateRate() != null)
                .map(r -> {
                    StringBuilder sb = new StringBuilder();
                    if (r.getYear() != null) sb.append(r.getYear()).append(" 年公开来源显示，");
                    if (r.getEmploymentRate() != null) {
                        sb.append("就业/去向落实率约 ").append(r.getEmploymentRate().stripTrailingZeros().toPlainString()).append("%");
                    }
                    if (r.getPostgraduateRate() != null) {
                        if (r.getEmploymentRate() != null) sb.append("，");
                        sb.append("升学/深造率约 ").append(r.getPostgraduateRate().stripTrailingZeros().toPlainString()).append("%");
                    }
                    return sb.toString();
                })
                .distinct()
                .limit(2)
                .collect(Collectors.toList());

        List<String> highlights = selected.stream()
                .map(CdutEmploymentRecord::getDestinationSummary)
                .filter(this::hasText)
                .flatMap(s -> splitSentences(s).stream())
                .distinct()
                .limit(4)
                .collect(Collectors.toList());
        highlights = java.util.stream.Stream.concat(metricHighlights.stream(), highlights.stream())
                .distinct()
                .limit(4)
                .collect(Collectors.toList());
        if (highlights.isEmpty()) {
            highlights = List.of("公开来源中暂未抓取到与你专业/目标岗位完全匹配的去向描述，建议先完善专业和目标岗位。");
        }

        String matchLabel = selected.stream().anyMatch(r -> score(r, major, targetRole) >= 4)
                ? "与你的专业和目标职业相关"
                : "使用 CDUT 公开就业数据作参考";
        String summary = buildSummary(major, targetRole, latestEmployment, latestPostgrad, highlights);

        return CdutEmploymentInsightDto.builder()
                .school(SCHOOL)
                .major(major)
                .targetRole(targetRole)
                .matchLabel(matchLabel)
                .summary(summary)
                .latestEmploymentRate(latestEmployment)
                .latestPostgraduateRate(latestPostgrad)
                .latestYear(latestYear)
                .sourceCount(selected.size())
                .updatedAt(selected.stream().map(CdutEmploymentRecord::getFetchedAt).filter(t -> t != null).max(LocalDateTime::compareTo).orElse(null))
                .destinationHighlights(highlights)
                .trend(buildTrend(selected))
                .sources(selected.stream().map(this::toSourceItem).collect(Collectors.toList()))
                .build();
    }

    @Transactional
    protected void refreshSources() {
        if (!REFRESHING.compareAndSet(false, true)) return;
        try {
            for (SeedSource seed : seedSources()) {
                try {
                    CdutEmploymentRecord record = fetchAndParse(seed);
                    recordRepository.findBySourceUrl(record.getSourceUrl())
                            .map(existing -> merge(existing, record))
                            .ifPresentOrElse(recordRepository::save, () -> recordRepository.save(record));
                } catch (Exception e) {
                    log.warn("[cdut-employment] source failed {}: {}", seed.url(), e.toString());
                }
            }
        } finally {
            REFRESHING.set(false);
        }
    }

    private CdutEmploymentRecord fetchAndParse(SeedSource seed) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(seed.url()))
                .timeout(Duration.ofSeconds(18))
                .header("User-Agent", USER_AGENT)
                .GET()
                .build();
        HttpResponse<byte[]> res = HTTP.send(req, HttpResponse.BodyHandlers.ofByteArray());
        if (res.statusCode() < 200 || res.statusCode() >= 300) {
            throw new IllegalStateException("HTTP " + res.statusCode());
        }
        String contentType = res.headers().firstValue("Content-Type").orElse("").toLowerCase(Locale.ROOT);
        String text;
        String title = seed.title();
        if (seed.url().toLowerCase(Locale.ROOT).contains(".pdf") || contentType.contains("pdf")) {
            text = extractPdfText(res.body());
        } else {
            String html = new String(res.body(), java.nio.charset.StandardCharsets.UTF_8);
            title = firstHtmlTitle(html, title);
            text = htmlToText(extractMainHtml(html));
        }
        String normalized = compact(text);
        Integer year = Optional.ofNullable(firstYear(seed.title())).orElseGet(() -> firstYear(normalized));
        String excerpt = chooseExcerpt(normalized, seed.keywords());

        return CdutEmploymentRecord.builder()
                .year(year)
                .sourceTitle(trim(title, 255))
                .sourceUrl(seed.url())
                .sourceType(seed.type())
                .majorKeyword(detectKeyword(normalized, seed.majorHints()))
                .careerKeyword(detectKeyword(normalized, seed.careerHints()))
                .employmentRate(firstRate(RATE_PATTERN, normalized))
                .postgraduateRate(firstRate(POSTGRAD_PATTERN, normalized))
                .destinationSummary(trim(excerpt, 1200))
                .rawExcerpt(trim(excerpt, 2000))
                .fetchedAt(LocalDateTime.now())
                .build();
    }

    private String extractPdfText(byte[] bytes) throws Exception {
        try (PDDocument doc = PDDocument.load(new ByteArrayInputStream(bytes))) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(Math.min(12, doc.getNumberOfPages()));
            return stripper.getText(doc);
        }
    }

    private String firstHtmlTitle(String html, String fallback) {
        Matcher m = Pattern.compile("(?is)<title[^>]*>(.*?)</title>").matcher(html == null ? "" : html);
        if (!m.find()) return fallback;
        String title = htmlToText(m.group(1));
        return hasText(title) ? title : fallback;
    }

    private String extractMainHtml(String html) {
        if (html == null) return "";
        List<Pattern> patterns = List.of(
                Pattern.compile("(?is)<div[^>]+class=[\"'][^\"']*content[^\"']*[\"'][^>]*>(.*?)<div[^>]+class=[\"'][^\"']*(?:mark|related|footer|side)[^\"']*[\"']"),
                Pattern.compile("(?is)<div[^>]+id=[\"']article[\"'][^>]*>(.*?)<div[^>]+class=[\"'][^\"']*(?:mark|related|footer|side)[^\"']*[\"']"),
                Pattern.compile("(?is)<article[^>]*>(.*?)</article>")
        );
        for (Pattern pattern : patterns) {
            Matcher m = pattern.matcher(html);
            if (m.find() && hasText(m.group(1))) {
                return m.group(1);
            }
        }
        return html;
    }

    private String htmlToText(String html) {
        if (html == null) return "";
        String noScript = html.replaceAll("(?is)<script[^>]*>.*?</script>", " ")
                .replaceAll("(?is)<style[^>]*>.*?</style>", " ")
                .replaceAll("(?is)<[^>]+>", " ");
        return compact(noScript
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\""));
    }

    private CdutEmploymentRecord merge(CdutEmploymentRecord existing, CdutEmploymentRecord next) {
        existing.setYear(next.getYear());
        existing.setSourceTitle(next.getSourceTitle());
        existing.setSourceType(next.getSourceType());
        existing.setMajorKeyword(next.getMajorKeyword());
        existing.setCareerKeyword(next.getCareerKeyword());
        existing.setEmploymentRate(next.getEmploymentRate());
        existing.setPostgraduateRate(next.getPostgraduateRate());
        existing.setDestinationSummary(next.getDestinationSummary());
        existing.setRawExcerpt(next.getRawExcerpt());
        existing.setFetchedAt(next.getFetchedAt());
        return existing;
    }

    private String inferTargetRole(UserProfileSnapshot snap) {
        if (snap == null) return "未填写目标职业";
        if (snap.getPreferences() != null && hasText(snap.getPreferences().getTargetRole())) {
            return snap.getPreferences().getTargetRole();
        }
        if (snap.getResume() != null && hasText(snap.getResume().getTargetJob())) {
            return snap.getResume().getTargetJob();
        }
        if (snap.getInterview() != null && hasText(snap.getInterview().getPositionName())) {
            return snap.getInterview().getPositionName();
        }
        if (snap.getAssessment() != null && snap.getAssessment().getSuggestedRoles() != null
                && !snap.getAssessment().getSuggestedRoles().isEmpty()) {
            return snap.getAssessment().getSuggestedRoles().get(0);
        }
        return "未填写目标职业";
    }

    private int score(CdutEmploymentRecord r, String major, String targetRole) {
        String hay = String.join(" ",
                nullToEmpty(r.getMajorKeyword()),
                nullToEmpty(r.getCareerKeyword()),
                nullToEmpty(r.getDestinationSummary()),
                nullToEmpty(r.getRawExcerpt())).toLowerCase(Locale.ROOT);
        int score = 0;
        for (String token : tokens(major)) if (hay.contains(token.toLowerCase(Locale.ROOT))) score += 2;
        for (String token : tokens(targetRole)) if (hay.contains(token.toLowerCase(Locale.ROOT))) score += 2;
        if (r.getEmploymentRate() != null) score += 1;
        if (Optional.ofNullable(r.getYear()).orElse(0) >= LocalDateTime.now().getYear() - 5) score += 1;
        return score;
    }

    private List<CdutEmploymentInsightDto.YearPoint> buildTrend(List<CdutEmploymentRecord> records) {
        return records.stream()
                .filter(r -> r.getYear() != null && (r.getEmploymentRate() != null || r.getPostgraduateRate() != null))
                .collect(Collectors.groupingBy(CdutEmploymentRecord::getYear))
                .entrySet()
                .stream()
                .sorted(java.util.Map.Entry.comparingByKey())
                .map(e -> CdutEmploymentInsightDto.YearPoint.builder()
                        .year(e.getKey())
                        .employmentRate(avg(e.getValue().stream().map(CdutEmploymentRecord::getEmploymentRate).toList()))
                        .postgraduateRate(avg(e.getValue().stream().map(CdutEmploymentRecord::getPostgraduateRate).toList()))
                        .build())
                .collect(Collectors.toList());
    }

    private CdutEmploymentInsightDto.SourceItem toSourceItem(CdutEmploymentRecord r) {
        return CdutEmploymentInsightDto.SourceItem.builder()
                .id(r.getId())
                .year(r.getYear())
                .title(r.getSourceTitle())
                .url(r.getSourceUrl())
                .sourceType(r.getSourceType())
                .majorKeyword(r.getMajorKeyword())
                .careerKeyword(r.getCareerKeyword())
                .employmentRate(r.getEmploymentRate())
                .postgraduateRate(r.getPostgraduateRate())
                .excerpt(r.getDestinationSummary())
                .fetchedAt(r.getFetchedAt())
                .build();
    }

    private List<SeedSource> seedSources() {
        return List.of(
                new SeedSource(
                        "成都理工大学2022届毕业生就业质量年度报告",
                        "https://cdutjy.cdut.edu.cn/data/mcit_editor/20230606/%E6%88%90%E9%83%BD%E7%90%86%E5%B7%A5%E5%A4%A7%E5%AD%A62022%E5%B1%8A%E6%AF%95%E4%B8%9A%E7%94%9F%E5%B0%B1%E4%B8%9A%E8%B4%A8%E9%87%8F%E5%B9%B4%E5%BA%A6%E6%8A%A5%E5%91%8A.pdf",
                        "CDUT_OFFICIAL_PDF",
                        List.of("就业率", "就业行业", "就业职业", "工程技术人员", "信息传输", "软件", "地质", "资源"),
                        List.of("计算机", "软件", "地质", "资源", "环境", "管理", "工程"),
                        List.of("工程技术人员", "软件", "信息", "产品", "数据", "教育", "公务员")),
                new SeedSource(
                        "成都理工大学就业率及就业前景公开汇总",
                        "https://www.dxsbb.com/news/15949.html",
                        "PUBLIC_SUMMARY",
                        List.of("就业率", "就业质量报告", "本科教学质量报告", "升学率"),
                        List.of("计算机", "软件", "地质", "资源", "环境", "管理", "工程"),
                        List.of("工程技术", "软件", "信息", "产品", "数据", "教育", "公务员")),
                new SeedSource(
                        "成都理工大学2024就业公开数据汇总",
                        "https://www.6617.com/p_332458023176.html",
                        "PUBLIC_SUMMARY",
                        List.of("去向落实率", "就业率", "升学率", "深造率", "选调生", "毕业生"),
                        List.of("计算机", "软件", "地质", "资源", "环境", "管理", "工程"),
                        List.of("工程技术", "软件", "信息", "产品", "数据", "选调生", "公务员")),
                new SeedSource(
                        "成都理工大学2023-2024学年本科教学质量报告公开页面",
                        "https://jypjyddc.cdut.edu.cn/info/1072/1935.htm",
                        "CDUT_OFFICIAL_PAGE",
                        List.of("去向落实率", "就业率", "升学率", "深造率", "本科教学质量报告"),
                        List.of("计算机", "软件", "地质", "资源", "环境", "管理", "工程"),
                        List.of("工程技术", "软件", "信息", "产品", "数据", "选调生", "公务员")),
                new SeedSource(
                        "四川省教育厅：成都理工大学就业工作公开报道",
                        "https://edu.sc.gov.cn/scedu/c100496/2024/7/24/a88f92f251c84d1f82b01a71241cbd87.shtml?version=zzzq",
                        "GOV_NEWS",
                        List.of("就业", "访企拓岗", "毕业生", "岗位"),
                        List.of("工程", "地质", "资源", "环境", "管理", "计算机"),
                        List.of("岗位", "企业", "工程", "信息", "数据"))
        );
    }

    private String chooseExcerpt(String text, List<String> keywords) {
        List<String> snippets = new ArrayList<>();
        for (String keyword : keywords) {
            int idx = text.indexOf(keyword);
            if (idx >= 0) {
                int start = Math.max(0, idx - 80);
                int end = Math.min(text.length(), idx + 220);
                snippets.add(text.substring(start, end));
            }
        }
        if (snippets.isEmpty()) snippets.add(text.substring(0, Math.min(text.length(), 360)));
        return snippets.stream().map(this::compact).distinct().limit(3).collect(Collectors.joining("。"));
    }

    private String detectKeyword(String text, List<String> candidates) {
        return candidates.stream().filter(text::contains).findFirst().orElse(null);
    }

    private BigDecimal firstRate(Pattern pattern, String text) {
        Matcher m = pattern.matcher(text);
        while (m.find()) {
            try {
                BigDecimal value = new BigDecimal(m.group(1));
                if (value.compareTo(BigDecimal.ZERO) >= 0 && value.compareTo(new BigDecimal("100")) <= 0) {
                    return value.setScale(2, RoundingMode.HALF_UP);
                }
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private Integer firstYear(String text) {
        Matcher m = YEAR_PATTERN.matcher(text);
        Integer best = null;
        int min = LocalDateTime.now().getYear() - 5;
        while (m.find()) {
            int y = Integer.parseInt(m.group(1));
            if (y >= min && y <= LocalDateTime.now().getYear()) {
                best = best == null ? y : Math.max(best, y);
            }
        }
        return best;
    }

    private BigDecimal avg(List<BigDecimal> values) {
        List<BigDecimal> safe = values.stream().filter(v -> v != null).toList();
        if (safe.isEmpty()) return null;
        BigDecimal sum = safe.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(safe.size()), 2, RoundingMode.HALF_UP);
    }

    private String buildSummary(String major, String targetRole, BigDecimal employment, BigDecimal postgrad, List<String> highlights) {
        StringBuilder sb = new StringBuilder();
        sb.append("基于 CDUT 公开来源，");
        if (hasText(major) && !"未填写专业".equals(major)) sb.append("结合你的专业「").append(major).append("」，");
        if (hasText(targetRole) && !"未填写目标职业".equals(targetRole)) sb.append("目标职业「").append(targetRole).append("」可参考近年就业去向。");
        else sb.append("建议先完善目标职业以获得更准确匹配。");
        if (employment != null) sb.append(" 最新可识别就业/去向落实率约 ").append(employment.stripTrailingZeros().toPlainString()).append("%。");
        if (postgrad != null) sb.append(" 深造/升学率约 ").append(postgrad.stripTrailingZeros().toPlainString()).append("%。");
        if (!highlights.isEmpty()) sb.append(" 重点线索：").append(highlights.get(0));
        return sb.toString();
    }

    private List<String> splitSentences(String value) {
        Set<String> out = new LinkedHashSet<>();
        for (String part : value.split("[。；;]")) {
            String s = compact(part);
            if (s.length() >= 12) out.add(trim(s, 120));
        }
        return new ArrayList<>(out);
    }

    private List<String> tokens(String value) {
        if (!hasText(value) || value.startsWith("未填写")) return List.of();
        String compact = value.replace("工程师", "").replace("专业", "").replace("学院", "");
        List<String> tokens = new ArrayList<>();
        for (String part : compact.split("[,，/\\s]+")) {
            if (part.length() >= 2) tokens.add(part);
        }
        if (compact.length() >= 2) tokens.add(compact);
        return tokens.stream().distinct().toList();
    }

    private String compact(String value) {
        if (value == null) return "";
        return value.replace('\u00A0', ' ').replaceAll("\\s+", " ").trim();
    }

    private String trim(String value, int max) {
        if (value == null) return null;
        String s = compact(value);
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }

    private String firstText(String value, String fallback) {
        return hasText(value) ? value : fallback;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private record SeedSource(String title, String url, String type, List<String> keywords,
                              List<String> majorHints, List<String> careerHints) {}

    private record ScoredRecord(CdutEmploymentRecord record, int score) {}
}
