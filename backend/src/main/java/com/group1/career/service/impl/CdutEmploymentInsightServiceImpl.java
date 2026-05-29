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
import java.util.Map;
import java.util.Objects;
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

    /** Backwards-compat default school name used when the entity has no school set. */
    private static final String DEFAULT_SCHOOL = "成都理工大学";
    private static final String DEMO_SCHOOL = "XX大学";
    private static final String DEMO_MAJOR = "软件工程";
    private static final String DEMO_TARGET_ROLE = "Java 后端开发";
    private static final List<Integer> DEMO_YEARS = List.of(2021, 2022, 2023, 2024, 2025);
    private static final List<String> DEMO_EMPLOYMENT_RATES = List.of("92.8", "93.9", "94.7", "95.6", "96.3");
    private static final List<String> DEMO_POSTGRAD_RATES = List.of("18.6", "19.8", "21.4", "22.7", "24.2");

    /**
     * The canonical list of "双一流" universities in Sichuan that this insight
     * service supports. Order matters: it is used to seed sources, so the most
     * authoritative / data-rich schools appear first. To add a school, add its
     * canonical name here and supply at least one entry in {@link #seedSources()}.
     */
    private static final List<String> SICHUAN_DOUBLE_FIRST_CLASS = List.of(
            "四川大学",
            "电子科技大学",
            "西南交通大学",
            "西南财经大学",
            "西南石油大学",
            "四川农业大学",
            "成都理工大学",
            "成都中医药大学"
    );
    private static final Set<String> SUPPORTED_SCHOOLS = Set.copyOf(SICHUAN_DOUBLE_FIRST_CLASS);
    private static final Duration CACHE_TTL = Duration.ofDays(14);
    private static final int SOURCE_LIMIT = 20;
    private static final int COVERAGE_YEAR_COUNT = 5;
    private static final String COVERAGE_VERIFIED_FULL = "VERIFIED_FULL";
    private static final String COVERAGE_PARTIAL = "PARTIAL";
    private static final String COVERAGE_MISSING = "MISSING";
    private static final String COVERAGE_NEEDS_REVIEW = "NEEDS_MANUAL_REVIEW";
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
        return buildInsight(uid);
    }

    @Override
    @Transactional
    public CdutEmploymentInsightDto refreshForCurrentUser() {
        Long uid = SecurityUtil.requireCurrentUserId();
        User user = userRepository.findById(uid).orElse(null);
        String school = normalizeSchool(user == null ? null : user.getSchool());
        if (isDemoSchool(school)) {
            return buildInsight(uid);
        }
        refreshSources();
        return buildInsight(uid);
    }

    private void ensureRecentData(String school) {
        try {
            if (recordRepository.countBySchool(school) == 0
                    || recordRepository.countBySchoolAndFetchedAtAfter(school, LocalDateTime.now().minus(CACHE_TTL)) == 0) {
                refreshSources();
            }
        } catch (Exception e) {
            log.warn("[employment-insight] best-effort refresh failed: {}", e.toString());
        }
    }

    private CdutEmploymentInsightDto buildInsight(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        UserProfileSnapshot snapshot = snapshotService.read(userId);
        String major = firstText(user == null ? null : user.getMajor(), "未填写专业");
        String school = normalizeSchool(user == null ? null : user.getSchool());
        String targetRole = inferTargetRole(snapshot);
        if (isDemoSchool(school)) {
            return demoInsight(major, targetRole);
        }
        if (school == null || !SUPPORTED_SCHOOLS.contains(school)) {
            return unavailableInsight(school, major, targetRole);
        }
        ensureRecentData(school);
        List<CdutEmploymentRecord> all = recordRepository.findBySchoolOrderByYearDescFetchedAtDesc(
                school, PageRequest.of(0, SOURCE_LIMIT));
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
                : "使用 " + school + " 公开就业数据作参考";
        String summary = buildSummary(school, major, targetRole, latestEmployment, latestPostgrad, highlights);

        return CdutEmploymentInsightDto.builder()
                .school(school)
                .major(major)
                .targetRole(targetRole)
                .matchLabel(matchLabel)
                .summary(summary)
                .latestEmploymentRate(latestEmployment)
                .latestPostgraduateRate(latestPostgrad)
                .latestYear(latestYear)
                .sourceCount(selected.size())
                .updatedAt(selected.stream().map(CdutEmploymentRecord::getFetchedAt).filter(Objects::nonNull).max(LocalDateTime::compareTo).orElse(null))
                .demoMode(false)
                .destinationHighlights(highlights)
                .trend(buildTrend(all))
                .coverage(buildCoverageAudit())
                .sources(selected.stream().map(this::toSourceItem).collect(Collectors.toList()))
                .build();
    }

    private String normalizeSchool(String raw) {
        if (!hasText(raw)) return null;
        String normalized = raw.trim();
        if (isDemoSchool(normalized)) return DEMO_SCHOOL;
        // Substring match handles common variants like "成都理工大学（双一流）" or
        // user-entered "西南交大" by checking the formal name first.
        for (String school : SICHUAN_DOUBLE_FIRST_CLASS) {
            if (normalized.contains(school)) return school;
        }
        // Friendly aliases users frequently enter in onboarding free-text.
        Map<String, String> aliases = Map.of(
                "川大", "四川大学",
                "成电", "电子科技大学",
                "西南交大", "西南交通大学",
                "西财", "西南财经大学",
                "西南石油", "西南石油大学",
                "川农", "四川农业大学",
                "成理", "成都理工大学",
                "成中医", "成都中医药大学"
        );
        for (Map.Entry<String, String> alias : aliases.entrySet()) {
            if (normalized.contains(alias.getKey())) return alias.getValue();
        }
        return normalized;
    }

    private boolean isDemoSchool(String school) {
        if (!hasText(school)) return false;
        String normalized = school.trim().toUpperCase(Locale.ROOT);
        return normalized.contains("XX大学") || normalized.contains("XX UNIVERSITY");
    }

    private CdutEmploymentInsightDto demoInsight(String major, String targetRole) {
        String demoMajor = demoField(major, DEMO_MAJOR);
        String demoTarget = demoField(targetRole, DEMO_TARGET_ROLE);
        List<Integer> years = DEMO_YEARS;
        List<CdutEmploymentInsightDto.YearPoint> trend = new ArrayList<>();
        for (int i = 0; i < years.size(); i++) {
            trend.add(yearPoint(years.get(i), DEMO_EMPLOYMENT_RATES.get(i), DEMO_POSTGRAD_RATES.get(i)));
        }
        Integer latestYear = years.get(years.size() - 1);
        BigDecimal latestEmployment = trend.get(trend.size() - 1).getEmploymentRate();
        BigDecimal latestPostgrad = trend.get(trend.size() - 1).getPostgraduateRate();

        return CdutEmploymentInsightDto.builder()
                .school(DEMO_SCHOOL)
                .major(demoMajor)
                .targetRole(demoTarget)
                .matchLabel("与你的专业和目标职业高度相关")
                .summary("当前为答辩脱敏演示数据：基于「" + demoMajor + "」专业与「" + demoTarget
                        + "」目标岗位，展示近 5 年就业/落实率与升学/深造率趋势。所有学校名称、来源与统计值均为虚构样例，不连接真实学校公开数据。")
                .latestEmploymentRate(latestEmployment)
                .latestPostgraduateRate(latestPostgrad)
                .latestYear(latestYear)
                .sourceCount(years.size())
                .updatedAt(LocalDateTime.now().minusDays(1))
                .demoMode(true)
                .destinationHighlights(List.of(
                        "主要去向包括软件研发、Java 后端开发、数据开发、测试工程、信息化运维等方向。",
                        "重点行业包括互联网软件、智能制造、金融科技、政企信息化等。",
                        "近 5 年就业/落实率与升学/深造率稳步提升，岗位方向与软件工程专业和 Java 后端开发目标高度相关。"
                ))
                .trend(trend)
                .coverage(demoCoverage(years))
                .sources(demoSources(years, demoMajor, demoTarget))
                .build();
    }

    private String demoField(String raw, String fallback) {
        if (!hasText(raw) || raw.startsWith("未填写")) return fallback;
        return raw.trim();
    }

    private CdutEmploymentInsightDto.YearPoint yearPoint(Integer year, String employment, String postgrad) {
        return CdutEmploymentInsightDto.YearPoint.builder()
                .year(year)
                .employmentRate(new BigDecimal(employment))
                .postgraduateRate(new BigDecimal(postgrad))
                .build();
    }

    private List<CdutEmploymentInsightDto.CoverageItem> demoCoverage(List<Integer> years) {
        return years.stream()
                .map(year -> CdutEmploymentInsightDto.CoverageItem.builder()
                        .school(DEMO_SCHOOL)
                        .year(year)
                        .status(COVERAGE_VERIFIED_FULL)
                        .label("演示完整")
                        .reason("该年份演示材料已补齐就业率、升学率与去向摘要。")
                        .build())
                .collect(Collectors.toList());
    }

    private List<CdutEmploymentInsightDto.SourceItem> demoSources(List<Integer> years, String major, String targetRole) {
        List<CdutEmploymentInsightDto.SourceItem> out = new ArrayList<>();
        for (int i = 0; i < years.size(); i++) {
            Integer year = years.get(i);
            out.add(CdutEmploymentInsightDto.SourceItem.builder()
                    .id(-1L - i)
                    .year(year)
                    .title(DEMO_SCHOOL + year + "届毕业生就业质量报告（演示）")
                    .url("demo://employment/" + year)
                    .sourceType("DEMO_REPORT")
                    .majorKeyword(major)
                    .careerKeyword(targetRole)
                    .employmentRate(new BigDecimal(DEMO_EMPLOYMENT_RATES.get(i)))
                    .postgraduateRate(new BigDecimal(DEMO_POSTGRAD_RATES.get(i)))
                    .excerpt(demoSourceExcerpt(year, major, targetRole))
                    .fetchedAt(LocalDateTime.now().minusDays(1))
                    .build());
        }
        return out;
    }

    private String demoSourceExcerpt(Integer year, String major, String targetRole) {
        return year + " 届演示样例：主要去向包括软件研发、Java 后端开发、数据开发、测试工程、信息化运维等方向；"
                + "重点行业包括互联网软件、智能制造、金融科技、政企信息化等；"
                + "岗位方向与「" + major + "」专业和「" + targetRole + "」目标岗位高度相关。";
    }

    private CdutEmploymentInsightDto unavailableInsight(String school, String major, String targetRole) {
        String displaySchool = hasText(school) ? school : "未填写学校";
        String summary;
        if (!hasText(school)) {
            summary = "请先在个人资料中填写学校。系统目前支持审计四川双一流高校（"
                    + String.join("、", SICHUAN_DOUBLE_FIRST_CLASS)
                    + "），不会用其他学校数据代替。";
        } else {
            summary = "「" + school + "」暂未接入公开就业数据。系统目前支持审计四川双一流高校（"
                    + String.join("、", SICHUAN_DOUBLE_FIRST_CLASS)
                    + "），接入后会展示来源、年份和更新时间。";
        }
        return CdutEmploymentInsightDto.builder()
                .school(displaySchool)
                .major(major)
                .targetRole(targetRole)
                .matchLabel("暂未接入该校公开就业数据")
                .summary(summary)
                .sourceCount(0)
                .demoMode(false)
                .destinationHighlights(List.of("当前没有可验证的公开就业来源，因此不生成就业率、升学率或去向结论。"))
                .trend(List.of())
                .coverage(buildCoverageAudit())
                .sources(List.of())
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
                    saveFallbackSource(seed, e);
                }
            }
        } finally {
            REFRESHING.set(false);
        }
    }

    private void saveFallbackSource(SeedSource seed, Exception cause) {
        recordRepository.findBySourceUrl(seed.url()).ifPresentOrElse(existing -> {
            if (!hasText(existing.getSchool())) existing.setSchool(seed.school());
            if (!hasText(existing.getDestinationSummary())) {
                existing.setDestinationSummary(fallbackSummary(seed));
            }
            existing.setFetchedAt(LocalDateTime.now());
            recordRepository.save(existing);
        }, () -> recordRepository.save(CdutEmploymentRecord.builder()
                .school(seed.school())
                .year(Optional.ofNullable(firstYear(seed.title())).orElse(LocalDateTime.now().getYear()))
                .sourceTitle(trim(seed.title(), 255))
                .sourceUrl(seed.url())
                .sourceType(seed.type())
                .majorKeyword(seed.majorHints().isEmpty() ? null : seed.majorHints().get(0))
                .careerKeyword(seed.careerHints().isEmpty() ? null : seed.careerHints().get(0))
                .destinationSummary(fallbackSummary(seed))
                .rawExcerpt("公开来源入口暂时无法抓取正文：" + cause.toString())
                .fetchedAt(LocalDateTime.now())
                .build()));
    }

    private String fallbackSummary(SeedSource seed) {
        return "已接入 " + seed.school() + " 的公开就业来源入口，正文抓取失败时保留链接供核验。";
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
                .school(seed.school())
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
        existing.setSchool(next.getSchool());
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

    private List<CdutEmploymentInsightDto.CoverageItem> buildCoverageAudit() {
        List<Integer> years = coverageYears();
        List<CdutEmploymentRecord> records = recordRepository.findBySchoolInAndYearIn(SICHUAN_DOUBLE_FIRST_CLASS, years);
        Map<String, List<CdutEmploymentRecord>> bySchoolYear = records.stream()
                .filter(r -> hasText(r.getSchool()) && r.getYear() != null)
                .collect(Collectors.groupingBy(r -> r.getSchool() + "::" + r.getYear()));

        List<CdutEmploymentInsightDto.CoverageItem> out = new ArrayList<>();
        for (String school : SICHUAN_DOUBLE_FIRST_CLASS) {
            for (Integer year : years) {
                List<CdutEmploymentRecord> matched = bySchoolYear.getOrDefault(school + "::" + year, List.of());
                out.add(coverageItem(school, year, matched));
            }
        }
        return out;
    }

    private List<Integer> coverageYears() {
        int latestGraduateYear = LocalDateTime.now().getYear() - 1;
        List<Integer> years = new ArrayList<>();
        for (int i = 0; i < COVERAGE_YEAR_COUNT; i++) {
            years.add(latestGraduateYear - i);
        }
        years.sort(Integer::compareTo);
        return years;
    }

    private CdutEmploymentInsightDto.CoverageItem coverageItem(String school, Integer year, List<CdutEmploymentRecord> records) {
        if (records == null || records.isEmpty()) {
            return CdutEmploymentInsightDto.CoverageItem.builder()
                    .school(school)
                    .year(year)
                    .status(COVERAGE_MISSING)
                    .label("缺失")
                    .reason("未找到该校该届官方就业质量报告或可核验公开页面。")
                    .build();
        }

        CdutEmploymentRecord best = records.stream()
                .sorted(Comparator.comparingInt(this::coverageScore).reversed())
                .findFirst()
                .orElse(records.get(0));
        String type = nullToEmpty(best.getSourceType()).toUpperCase(Locale.ROOT);
        boolean official = type.contains("OFFICIAL");
        boolean officialReport = official && (type.contains("PDF") || nullToEmpty(best.getSourceTitle()).contains("就业质量"));
        boolean hasCoreMetrics = best.getEmploymentRate() != null || best.getPostgraduateRate() != null;
        boolean hasDestination = hasText(best.getDestinationSummary()) && !best.getDestinationSummary().contains("正文抓取失败");

        String status;
        String label;
        String reason;
        if (officialReport && hasCoreMetrics && hasDestination) {
            status = COVERAGE_VERIFIED_FULL;
            label = "已验证完整";
            reason = "已接入官方报告/页面，并识别到核心指标与去向描述。";
        } else if (official && (hasCoreMetrics || hasDestination)) {
            status = COVERAGE_PARTIAL;
            label = "部分覆盖";
            reason = "来源为官方页面，但核心字段尚未全部抽取。";
        } else {
            status = COVERAGE_NEEDS_REVIEW;
            label = "待人工核验";
            reason = "仅有聚合页或入口链接，不能作为完整就业数据。";
        }

        return CdutEmploymentInsightDto.CoverageItem.builder()
                .school(school)
                .year(year)
                .status(status)
                .label(label)
                .reason(reason)
                .sourceUrl(best.getSourceUrl())
                .build();
    }

    private int coverageScore(CdutEmploymentRecord r) {
        int score = 0;
        String type = nullToEmpty(r.getSourceType()).toUpperCase(Locale.ROOT);
        if (type.contains("OFFICIAL")) score += 4;
        if (type.contains("PDF")) score += 2;
        if (r.getEmploymentRate() != null) score += 2;
        if (r.getPostgraduateRate() != null) score += 1;
        if (hasText(r.getDestinationSummary()) && !r.getDestinationSummary().contains("正文抓取失败")) score += 2;
        return score;
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
        // Each Sichuan Double First-Class university gets at least one
        // crawlable public source. We prefer official 就业指导中心 portals when
        // they expose stable URLs; otherwise we fall back to long-lived
        // aggregator pages (dxsbb.com etc.) so the table is never empty
        // for that school. When a source 404s the crawler swallows it and
        // The coverage audit still records missing/partial years; no fallback
        // metrics are fabricated when a source cannot be parsed.
        return List.of(
                // ── 成都理工大学 ──────────────────────────────────────────────
                new SeedSource("成都理工大学",
                        "成都理工大学2022届毕业生就业质量年度报告",
                        "https://cdutjy.cdut.edu.cn/data/mcit_editor/20230606/%E6%88%90%E9%83%BD%E7%90%86%E5%B7%A5%E5%A4%A7%E5%AD%A62022%E5%B1%8A%E6%AF%95%E4%B8%9A%E7%94%9F%E5%B0%B1%E4%B8%9A%E8%B4%A8%E9%87%8F%E5%B9%B4%E5%BA%A6%E6%8A%A5%E5%91%8A.pdf",
                        "CDUT_OFFICIAL_PDF",
                        List.of("就业率", "就业行业", "就业职业", "工程技术人员", "信息传输", "软件", "地质", "资源"),
                        List.of("计算机", "软件", "地质", "资源", "环境", "管理", "工程"),
                        List.of("工程技术人员", "软件", "信息", "产品", "数据", "教育", "公务员")),
                new SeedSource("成都理工大学",
                        "成都理工大学就业率及就业前景公开汇总",
                        "https://www.dxsbb.com/news/15949.html",
                        "PUBLIC_SUMMARY",
                        List.of("就业率", "就业质量报告", "本科教学质量报告", "升学率"),
                        List.of("计算机", "软件", "地质", "资源", "环境", "管理", "工程"),
                        List.of("工程技术", "软件", "信息", "产品", "数据", "教育", "公务员")),

                // ── 四川大学 ─────────────────────────────────────────────────
                new SeedSource("四川大学",
                        "四川大学毕业生就业服务网",
                        "https://job.scu.edu.cn/",
                        "SCU_OFFICIAL_PAGE",
                        List.of("就业", "招聘", "签约率", "去向落实率", "升学"),
                        List.of("文学", "理学", "工学", "医学", "管理", "经济", "法学", "计算机"),
                        List.of("教师", "医生", "工程师", "研发", "管理", "公务员", "选调生")),
                new SeedSource("四川大学",
                        "四川大学就业率及就业方向公开汇总",
                        "https://www.dxsbb.com/news/13036.html",
                        "PUBLIC_SUMMARY",
                        List.of("就业率", "毕业生", "升学率", "深造率"),
                        List.of("文科", "理科", "工科", "医学", "管理", "经济"),
                        List.of("教师", "医生", "工程师", "管理", "公务员")),

                // ── 电子科技大学 ─────────────────────────────────────────────
                new SeedSource("电子科技大学",
                        "电子科技大学就业指导中心",
                        "https://jiuye.uestc.edu.cn/",
                        "UESTC_OFFICIAL_PAGE",
                        List.of("就业", "招聘", "签约", "去向落实率"),
                        List.of("电子", "通信", "计算机", "自动化", "信息", "软件", "微电子"),
                        List.of("研发工程师", "算法", "芯片", "软件", "通信", "硬件")),
                new SeedSource("电子科技大学",
                        "电子科技大学就业前景公开汇总",
                        "https://www.dxsbb.com/news/12922.html",
                        "PUBLIC_SUMMARY",
                        List.of("就业率", "升学率", "深造率", "央企", "互联网"),
                        List.of("电子", "通信", "计算机", "信息", "软件"),
                        List.of("研发", "算法", "芯片", "互联网", "软件")),

                // ── 西南交通大学 ──────────────────────────────────────────────
                new SeedSource("西南交通大学",
                        "西南交通大学就业信息网",
                        "https://job.swjtu.edu.cn/",
                        "SWJTU_OFFICIAL_PAGE",
                        List.of("就业", "招聘", "签约率", "去向落实率", "升学"),
                        List.of("交通", "土木", "机械", "电气", "计算机", "材料", "测绘"),
                        List.of("工程师", "研发", "央企", "国企", "铁路", "建筑")),
                new SeedSource("西南交通大学",
                        "西南交通大学就业前景公开汇总",
                        "https://www.dxsbb.com/news/13027.html",
                        "PUBLIC_SUMMARY",
                        List.of("就业率", "升学率", "深造率", "央企", "国企"),
                        List.of("交通", "土木", "机械", "电气", "计算机"),
                        List.of("工程师", "央企", "国企", "铁路")),

                // ── 西南财经大学 ──────────────────────────────────────────────
                new SeedSource("西南财经大学",
                        "西南财经大学学生就业指导中心",
                        "https://job.swufe.edu.cn/",
                        "SWUFE_OFFICIAL_PAGE",
                        List.of("就业", "招聘", "签约", "金融", "去向落实率"),
                        List.of("金融", "经济", "会计", "财政", "统计", "保险", "管理"),
                        List.of("银行", "证券", "基金", "审计", "公务员", "管培生")),
                new SeedSource("西南财经大学",
                        "西南财经大学就业前景公开汇总",
                        "https://www.dxsbb.com/news/13032.html",
                        "PUBLIC_SUMMARY",
                        List.of("就业率", "升学率", "金融", "银行", "证券"),
                        List.of("金融", "经济", "会计", "财政", "统计"),
                        List.of("银行", "证券", "基金", "管培生")),

                // ── 西南石油大学 ──────────────────────────────────────────────
                new SeedSource("西南石油大学",
                        "西南石油大学就业指导中心",
                        "https://job.swpu.edu.cn/",
                        "SWPU_OFFICIAL_PAGE",
                        List.of("就业", "招聘", "签约", "石油", "去向落实率"),
                        List.of("石油", "化工", "机械", "地质", "测井", "计算机"),
                        List.of("工程师", "石油", "央企", "国企", "研发")),
                new SeedSource("西南石油大学",
                        "西南石油大学就业前景公开汇总",
                        "https://www.dxsbb.com/news/13029.html",
                        "PUBLIC_SUMMARY",
                        List.of("就业率", "升学率", "石油", "央企"),
                        List.of("石油", "化工", "机械", "地质"),
                        List.of("石油", "央企", "工程师")),

                // ── 四川农业大学 ──────────────────────────────────────────────
                new SeedSource("四川农业大学",
                        "四川农业大学就业信息网",
                        "https://job.sicau.edu.cn/",
                        "SICAU_OFFICIAL_PAGE",
                        List.of("就业", "招聘", "签约", "去向落实率", "升学"),
                        List.of("农学", "动物", "食品", "园艺", "林学", "兽医", "生物"),
                        List.of("农技", "教师", "公务员", "选调生", "研发")),
                new SeedSource("四川农业大学",
                        "四川农业大学就业前景公开汇总",
                        "https://www.dxsbb.com/news/13046.html",
                        "PUBLIC_SUMMARY",
                        List.of("就业率", "升学率", "农技", "选调生"),
                        List.of("农学", "动物", "食品", "园艺"),
                        List.of("农技", "公务员", "选调生")),

                // ── 成都中医药大学 ────────────────────────────────────────────
                new SeedSource("成都中医药大学",
                        "成都中医药大学就业信息网",
                        "https://jy.cdutcm.edu.cn/",
                        "CDUTCM_OFFICIAL_PAGE",
                        List.of("就业", "招聘", "签约", "去向落实率", "升学"),
                        List.of("中医", "中药", "针灸", "护理", "药学", "康复"),
                        List.of("医生", "药师", "医院", "公立医院", "医药企业")),
                new SeedSource("成都中医药大学",
                        "成都中医药大学就业前景公开汇总",
                        "https://www.dxsbb.com/news/13037.html",
                        "PUBLIC_SUMMARY",
                        List.of("就业率", "升学率", "医院", "医药"),
                        List.of("中医", "中药", "针灸", "护理"),
                        List.of("医生", "药师", "医院"))
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

    private String buildSummary(String school, String major, String targetRole, BigDecimal employment, BigDecimal postgrad, List<String> highlights) {
        StringBuilder sb = new StringBuilder();
        sb.append("基于 ").append(school).append(" 公开来源，");
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

    private record SeedSource(String school, String title, String url, String type, List<String> keywords,
                              List<String> majorHints, List<String> careerHints) {}

    private record ScoredRecord(CdutEmploymentRecord record, int score) {}
}
