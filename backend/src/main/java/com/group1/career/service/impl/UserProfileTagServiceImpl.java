package com.group1.career.service.impl;

import com.group1.career.model.dto.AgentUserProfileDto;
import com.group1.career.model.dto.UserProfileSnapshot;
import com.group1.career.model.dto.UserProfileTagDto;
import com.group1.career.model.entity.Resume;
import com.group1.career.model.entity.ResumeProfileKeyword;
import com.group1.career.model.entity.User;
import com.group1.career.model.entity.UserFact;
import com.group1.career.model.entity.UserProfileTag;
import com.group1.career.repository.ResumeProfileKeywordRepository;
import com.group1.career.repository.ResumeRepository;
import com.group1.career.repository.UserFactRepository;
import com.group1.career.repository.UserProfileTagRepository;
import com.group1.career.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group1.career.service.AgentProfileService;
import com.group1.career.service.CheckInService;
import com.group1.career.service.FileService;
import com.group1.career.service.UserProfileSnapshotService;
import com.group1.career.service.UserProfileTagService;
import com.group1.career.utils.PdfTextExtractor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserProfileTagServiceImpl implements UserProfileTagService {

    private static final String SOURCE_SYSTEM = "SYSTEM_INFERRED";
    private static final String SOURCE_USER = "USER_EDITED";
    private static final List<String> CATEGORY_ORDER = List.of(
            UserProfileTag.CATEGORY_SKILL,
            UserProfileTag.CATEGORY_BACKGROUND,
            UserProfileTag.CATEGORY_GROWTH,
            UserProfileTag.CATEGORY_GOAL
    );
    private static final Set<String> TOKEN_STOPWORDS = Set.of(
            "用户", "目标", "岗位", "状态", "待补充", "未知", "暂无", "简历状态", "简历匹配",
            "公司", "负责", "参与", "完成", "熟悉", "掌握", "了解", "使用", "进行", "相关",
            "basic", "profile", "target", "role", "state", "status", "null", "none", "no", "yes",
            "company", "responsible", "use", "used", "using", "related"
    );
    private static final Set<String> CONTACT_TOKENS = Set.of(
            "email", "mail", "phone", "tel", "mobile", "wechat", "weixin", "qq", "github", "linkedin"
    );
    private static final Set<String> NON_SKILL_TOKENS = Set.of(
            "本科", "课程", "核心课程", "项目经历", "专业排名前"
    );
    private static final List<String> KNOWN_TERMS = List.of(
            "前端", "后端", "全栈", "算法", "数据", "产品", "运营", "设计", "测试", "开发", "工程师",
            "Java", "Python", "JavaScript", "TypeScript", "Vue", "React", "Spring", "SpringBoot",
            "Node", "Express", "UniApp", "微信小程序", "小程序", "HTML", "CSS", "Sass", "Less",
            "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "Git", "Linux",
            "AI", "AIGC", "LLM", "NLP", "UI", "UX",
            "沟通", "表达", "项目", "实习", "面试", "校招", "求职", "简历", "匹配", "学习", "探索",
            "应届", "学生", "转行", "城市", "远程", "作品集", "英语", "技术", "管理", "研究",
            "本科", "硕士", "博士", "学士", "课程", "竞赛", "奖学金", "论文", "证书",
            "后端工程师", "前端工程师", "产品经理", "数据分析师", "算法工程师"
    );

    private final UserProfileTagRepository tagRepository;
    private final ResumeProfileKeywordRepository resumeKeywordRepository;
    private final UserFactRepository factRepository;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final UserProfileSnapshotService snapshotService;
    private final AgentProfileService agentProfileService;
    private final CheckInService checkInService;
    private final ObjectMapper objectMapper;
    private final FileService fileService;

    @Override
    @Transactional(readOnly = true)
    public UserProfileTagDto.Summary getSummary(Long userId) {
        List<UserProfileTagDto> tags = tagRepository.findByUserIdOrderByCategoryAscWeightDescUpdatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .toList();
        return buildSummary(tags);
    }

    @Override
    @Transactional
    public UserProfileTagDto.Summary refreshFromSignals(Long userId) {
        tagRepository.deleteByUserIdAndSource(userId, SOURCE_SYSTEM);
        tagRepository.flush();
        retokenizeUserEditedTags(userId);
        List<TagSpec> inferred = inferTags(userId);
        for (TagSpec spec : inferred) {
            UserProfileTag tag = tagRepository
                    .findByUserIdAndCategoryAndLabel(userId, spec.category(), spec.label())
                    .orElseGet(() -> UserProfileTag.builder()
                            .userId(userId)
                            .category(spec.category())
                            .label(spec.label())
                            .build());
            if (SOURCE_USER.equals(tag.getSource())) {
                continue;
            }
            tag.setWeight(spec.weight());
            tag.setSource(SOURCE_SYSTEM);
            tag.setEvidence(spec.evidence());
            tag.setEditable(true);
            tagRepository.save(tag);
        }
        return getSummary(userId);
    }

    @Override
    @Transactional
    public List<UserProfileTagDto> extractResumeKeywords(Long userId, Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        if (!Objects.equals(resume.getUserId(), userId)) {
            throw new RuntimeException("Forbidden");
        }
        List<ResumeProfileKeyword> ready = resumeKeywordRepository
                .findByResumeIdAndStatusOrderByWeightDescUpdatedAtDesc(resumeId, ResumeProfileKeyword.STATUS_READY);
        if (!ready.isEmpty()) {
            return ready.stream()
                    .map(this::toDto)
                    .limit(16)
                    .toList();
        }
        return getSummary(userId).getTags().stream()
                .filter(tag -> tag.getEvidence() != null && tag.getEvidence().contains("resume:" + resumeId))
                .limit(16)
                .toList();
    }

    @Override
    @Transactional
    public UserProfileTagDto.Summary saveManualTags(Long userId, List<UserProfileTagDto> tags) {
        tagRepository.deleteByUserIdAndSource(userId, SOURCE_USER);
        tagRepository.flush();
        if (tags != null) {
            tags.stream()
                    .filter(Objects::nonNull)
                    .map(this::sanitize)
                    .filter(Objects::nonNull)
                    .flatMap(dto -> tokenizeSpec(new TagSpec(
                            dto.getCategory(),
                            dto.getLabel(),
                            dto.getWeight() == null ? 70 : dto.getWeight(),
                            dto.getEvidence() == null ? "user edited" : dto.getEvidence()
                    )).stream())
                    .forEach(spec -> {
                        UserProfileTag tag = tagRepository
                                .findByUserIdAndCategoryAndLabel(userId, spec.category(), spec.label())
                                .orElseGet(() -> UserProfileTag.builder()
                                        .userId(userId)
                                        .category(spec.category())
                                        .label(spec.label())
                                        .build());
                        tag.setWeight(clamp(spec.weight(), 1, 100));
                        tag.setSource(SOURCE_USER);
                        tag.setEvidence(spec.evidence());
                        tag.setEditable(true);
                        tagRepository.save(tag);
                    });
        }
        return refreshFromSignals(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public String renderForPrompt(Long userId) {
        UserProfileTagDto.Summary summary = getSummary(userId);
        if (summary.getTags() == null || summary.getTags().isEmpty()) return "";
        StringBuilder sb = new StringBuilder("[STRUCTURED USER PROFILE TAGS]\n");
        summary.getSections().forEach((category, tags) -> {
            if (tags == null || tags.isEmpty()) return;
            String joined = tags.stream()
                    .limit(8)
                    .map(t -> t.getLabel() + "(" + t.getWeight() + ")")
                    .collect(Collectors.joining(", "));
            sb.append("- ").append(category).append(": ").append(joined).append("\n");
        });
        return sb.toString();
    }

    private List<TagSpec> inferTags(Long userId) {
        List<TagSpec> out = new ArrayList<>();
        UserProfileSnapshot snapshot = snapshotService.read(userId);
        List<UserFact> facts = factRepository.findByUserId(userId);
        User user = userRepository.findById(userId).orElse(null);

        if (user != null) {
            add(out, UserProfileTag.CATEGORY_BACKGROUND, user.getSchool(), 70, "basic profile: school");
            add(out, UserProfileTag.CATEGORY_BACKGROUND, user.getMajor(), 70, "basic profile: major");
            if (user.getGraduationYear() != null) {
                add(out, UserProfileTag.CATEGORY_BACKGROUND, user.getGraduationYear() + " 届", 55, "basic profile: graduation year");
            }
        }

        if (snapshot.getOnboarding() != null) {
            add(out, UserProfileTag.CATEGORY_BACKGROUND, snapshot.getOnboarding().getIdentityType(), 65, "onboarding identity");
            String hasResume = snapshot.getOnboarding().getHasResume();
            if (hasText(hasResume)) add(out, UserProfileTag.CATEGORY_BACKGROUND, "简历状态：" + hasResume, 50, "onboarding resume state");
        }
        if (snapshot.getAssessment() != null) {
            add(out, UserProfileTag.CATEGORY_BACKGROUND, snapshot.getAssessment().getSummary(), 68, "assessment result");
            if (snapshot.getAssessment().getSuggestedRoles() != null) {
                snapshot.getAssessment().getSuggestedRoles().stream().limit(3)
                        .forEach(role -> add(out, UserProfileTag.CATEGORY_GOAL, role, 58, "assessment suggested role"));
            }
        }
        if (snapshot.getResume() != null) {
            add(out, UserProfileTag.CATEGORY_GOAL, snapshot.getResume().getTargetJob(), 78, "resume target job");
            Integer score = snapshot.getResume().getDiagnosisScore();
            if (score != null) add(out, UserProfileTag.CATEGORY_GROWTH, "简历匹配 " + score + " 分", weightFromScore(score), "resume diagnosis score");
        }
        addResumeSignals(out, userId);
        if (snapshot.getInterview() != null) {
            add(out, UserProfileTag.CATEGORY_GOAL, snapshot.getInterview().getPositionName(), 72, "interview target");
            if (snapshot.getInterview().getStrongDimensions() != null) {
                snapshot.getInterview().getStrongDimensions().forEach(s ->
                        add(out, UserProfileTag.CATEGORY_SKILL, s, 78, "interview strong dimension"));
            }
            if (snapshot.getInterview().getWeakDimensions() != null) {
                snapshot.getInterview().getWeakDimensions().forEach(s ->
                        add(out, UserProfileTag.CATEGORY_GROWTH, s, 70, "interview growth dimension"));
            }
        }

        for (UserFact f : facts) {
            String category = mapFactCategory(f);
            String label = factLabel(f);
            int weight = f.getConfidence() == null ? 60 :
                    clamp(f.getConfidence().multiply(java.math.BigDecimal.valueOf(100)).intValue(), 35, 100);
            add(out, category, label, weight, "fact: " + f.getFactKey());
        }

        try {
            AgentUserProfileDto profile = agentProfileService.getProfile(userId);
            if (profile.getTarget() != null) {
                add(out, UserProfileTag.CATEGORY_GOAL, profile.getTarget().getRole(), 85, "agent target role");
            }
            if (profile.getSkills() != null) {
                profile.getSkills().forEach(s -> add(out, UserProfileTag.CATEGORY_SKILL,
                        s.getName(), s.getLevel(), "agent skill profile"));
            }
            if (profile.getMissingSignals() != null) {
                profile.getMissingSignals().stream().limit(4)
                        .forEach(s -> add(out, UserProfileTag.CATEGORY_GROWTH, s.getLabel(), 55, "missing signal"));
            }
        } catch (Exception ignored) {
            // Profile rebuild is best-effort; tags can still come from snapshot/facts.
        }

        try {
            CheckInService.CheckInStatus status = checkInService.getStatus(userId);
            if (status.getStreakDays() > 0) {
                add(out, UserProfileTag.CATEGORY_GROWTH, "连续行动 " + status.getStreakDays() + " 天", 50 + Math.min(40, status.getStreakDays() * 5), "check-in streak");
            }
        } catch (Exception ignored) {}

        return mergeSpecs(out);
    }

    private String mapFactCategory(UserFact f) {
        String c = f.getCategory();
        String key = f.getFactKey() == null ? "" : f.getFactKey().toLowerCase(Locale.ROOT);
        if ("SKILL".equals(c)) return key.contains("weak") ? UserProfileTag.CATEGORY_GROWTH : UserProfileTag.CATEGORY_SKILL;
        if ("CAREER_GOAL".equals(c) || key.contains("target") || key.contains("goal")) return UserProfileTag.CATEGORY_GOAL;
        if ("PREFERENCE".equals(c) && (key.contains("learn") || key.contains("weak") || key.contains("difficulty"))) return UserProfileTag.CATEGORY_GROWTH;
        if ("PERSONALITY".equals(c) || "EXPERIENCE".equals(c)) return UserProfileTag.CATEGORY_BACKGROUND;
        return UserProfileTag.CATEGORY_BACKGROUND;
    }

    private String factLabel(UserFact f) {
        String value = f.getFactValue();
        if (hasText(value)) return value.trim();
        return f.getFactKey();
    }

    private List<TagSpec> mergeSpecs(List<TagSpec> specs) {
        Map<String, TagSpec> merged = new LinkedHashMap<>();
        for (TagSpec raw : specs) {
            for (TagSpec spec : tokenizeSpec(raw)) {
            if (!hasText(spec.label())) continue;
            String normalized = spec.label().trim();
            if (normalized.length() > 24) normalized = normalized.substring(0, 24);
            String key = spec.category() + "::" + normalized.toLowerCase(Locale.ROOT);
            TagSpec current = merged.get(key);
            if (current == null || spec.weight() > current.weight()) {
                merged.put(key, new TagSpec(spec.category(), normalized, clamp(spec.weight(), 1, 100), spec.evidence()));
            }
            }
        }
        return merged.values().stream()
                .sorted(Comparator.comparing(TagSpec::category).thenComparing(TagSpec::weight).reversed())
                .limit(80)
                .toList();
    }

    private void add(List<TagSpec> out, String category, String label, Integer weight, String evidence) {
        if (!hasText(label)) return;
        String clean = label.trim();
        if ("null".equalsIgnoreCase(clean) || "-".equals(clean)) return;
        out.add(new TagSpec(category, clean, weight == null ? 50 : weight, evidence));
    }

    private void addResumeSignals(List<TagSpec> out, Long userId) {
        resumeKeywordRepository.findByUserIdAndStatusOrderByCategoryAscWeightDescUpdatedAtDesc(userId, ResumeProfileKeyword.STATUS_READY)
                .forEach(keyword -> add(out, keyword.getCategory(), keyword.getLabel(),
                        keyword.getWeight() == null ? 60 : keyword.getWeight(),
                        keyword.getEvidence()));

        List<Resume> resumes = resumeRepository.findByUserId(userId);
        resumes.stream()
                .sorted(Comparator.comparing(Resume::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(2)
                .forEach(resume -> {
                    String prefix = "resume:" + resume.getResumeId() + " ";
                    add(out, UserProfileTag.CATEGORY_GOAL, resume.getTargetJob(), 76, prefix + "target job");
                    add(out, UserProfileTag.CATEGORY_BACKGROUND, resume.getTitle(), 48, prefix + "title");
                    if (resume.getUpdatedAt() != null) {
                        add(out, UserProfileTag.CATEGORY_GROWTH, resume.getUpdatedAt().getYear() + " 简历", 54, prefix + "updated year");
                    }
                    addParsedResumeContent(out, resume);
                });
    }

    private void ensureResumeText(Resume resume) {
        if (hasText(resume.getParsedContent())) return;
        if (!hasText(resume.getFileUrl())) return;
        try {
            byte[] pdfBytes = fileService.downloadBytes(resume.getFileUrl());
            String text = PdfTextExtractor.extractFromBytes(pdfBytes);
            if (!hasText(text)) return;
            Map<String, String> parsed = Map.of("rawContent", text);
            resume.setParsedContent(objectMapper.writeValueAsString(parsed));
            resumeRepository.save(resume);
        } catch (Exception ignored) {
            // Keyword extraction is best-effort; upload must not become brittle.
        }
    }

    private void addParsedResumeContent(List<TagSpec> out, Resume resume) {
        if (!hasText(resume.getParsedContent())) return;
        String prefix = "resume:" + resume.getResumeId() + " ";
        try {
            JsonNode root = objectMapper.readTree(resume.getParsedContent());
            addJsonText(out, UserProfileTag.CATEGORY_SKILL, root.path("skills"), 82, prefix + "skills");
            addJsonText(out, UserProfileTag.CATEGORY_BACKGROUND, root.path("education"), 66, prefix + "education");
            addJsonText(out, UserProfileTag.CATEGORY_SKILL, root.path("projects"), 72, prefix + "projects");
            addJsonText(out, UserProfileTag.CATEGORY_GROWTH, root.path("experience"), 70, prefix + "experience");
            addJsonText(out, UserProfileTag.CATEGORY_GROWTH, root.path("work"), 70, prefix + "work");
            addJsonText(out, UserProfileTag.CATEGORY_GROWTH, root.path("rawContent"), 58, prefix + "raw content");
        } catch (Exception ignored) {
            add(out, UserProfileTag.CATEGORY_GROWTH, resume.getParsedContent(), 54, prefix + "parsed content");
        }
    }

    private void addJsonText(List<TagSpec> out, String category, JsonNode node, int weight, String evidence) {
        if (node == null || node.isMissingNode() || node.isNull()) return;
        if (node.isTextual() || node.isNumber() || node.isBoolean()) {
            add(out, category, node.asText(), weight, evidence);
            return;
        }
        if (node.isArray()) {
            node.forEach(child -> addJsonText(out, category, child, weight, evidence));
            return;
        }
        if (node.isObject()) {
            node.fields().forEachRemaining(entry -> addJsonText(out, category, entry.getValue(), weight, evidence + ":" + entry.getKey()));
        }
    }

    private void retokenizeUserEditedTags(Long userId) {
        List<UserProfileTag> existing = tagRepository.findByUserIdAndSource(userId, SOURCE_USER);
        if (existing.isEmpty()) return;
        List<TagSpec> tokenized = existing.stream()
                .flatMap(tag -> tokenizeSpec(new TagSpec(
                        tag.getCategory(),
                        tag.getLabel(),
                        tag.getWeight() == null ? 70 : tag.getWeight(),
                        tag.getEvidence() == null ? "user edited" : tag.getEvidence()
                )).stream())
                .toList();
        tagRepository.deleteByUserIdAndSource(userId, SOURCE_USER);
        tagRepository.flush();
        for (TagSpec spec : mergeSpecs(tokenized)) {
            UserProfileTag tag = UserProfileTag.builder()
                    .userId(userId)
                    .category(spec.category())
                    .label(spec.label())
                    .weight(spec.weight())
                    .source(SOURCE_USER)
                    .evidence(spec.evidence())
                    .editable(true)
                    .build();
            tagRepository.save(tag);
        }
    }

    private List<TagSpec> tokenizeSpec(TagSpec spec) {
        if (spec == null || !hasText(spec.label())) return List.of();
        String label = normalizeLabel(spec.label());
        if (!hasText(label)) return List.of();
        LinkedHashMap<String, Integer> weighted = new LinkedHashMap<>();
        boolean includeTime = !UserProfileTag.CATEGORY_SKILL.equals(spec.category());
        for (String token : tokenizeLabel(label, includeTime)) {
            if (!isUsefulToken(token)) continue;
            if (UserProfileTag.CATEGORY_SKILL.equals(spec.category())
                    && (isTimeToken(token) || NON_SKILL_TOKENS.contains(normalizeLabel(token)))) continue;
            int tokenWeight = spec.weight();
            if (!token.equalsIgnoreCase(label)) tokenWeight = Math.max(35, spec.weight() - 8);
            weighted.merge(token, tokenWeight, Math::max);
        }
        if (weighted.isEmpty() && isUsefulToken(label)) {
            weighted.put(label, spec.weight());
        }
        return weighted.entrySet().stream()
                .map(e -> new TagSpec(spec.category(), e.getKey(), clamp(e.getValue(), 1, 100), spec.evidence()))
                .toList();
    }

    private List<String> tokenizeLabel(String label, boolean includeTime) {
        LinkedHashSet<String> out = new LinkedHashSet<>();
        String normalized = label
                .replaceAll("[，。；、,.|/\\\\()（）\\[\\]【】{}:：+&]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (!hasText(normalized)) return List.of();
        if (includeTime) addTimeTokens(label, out);

        for (String part : normalized.split(" ")) {
            String p = part.trim();
            if (!hasText(p)) continue;
            if (isContactLike(p)) continue;
            if (!includeTime && isTimeToken(p)) continue;
            for (String term : KNOWN_TERMS) {
                if (containsIgnoreCase(p, term)) out.add(term);
            }
            if (p.matches("[A-Za-z][A-Za-z0-9#.+-]{1,23}")) {
                out.add(p);
            } else if (p.matches("[A-Za-z0-9#.+-]+")) {
                for (String token : p.split("(?=[A-Z])|[-_]+")) {
                    if (isUsefulToken(token)) out.add(token);
                }
            } else {
                addMeaningfulChineseTokens(p, out);
            }
        }
        return new ArrayList<>(out);
    }

    private void addMeaningfulChineseTokens(String text, Set<String> out) {
        String zh = text.replaceAll("[^\\p{IsHan}A-Za-z0-9#.+-]", "");
        if (!hasText(zh)) return;
        if (zh.matches(".*(19|20)\\d{2}.*")) {
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(19|20)\\d{2}").matcher(zh);
            while (matcher.find()) out.add(matcher.group());
        }
        if (zh.length() <= 6 && looksLikeCareerToken(zh)) {
            out.add(zh);
        }
    }

    private boolean looksLikeCareerToken(String token) {
        if (!isUsefulToken(token)) return false;
        if (KNOWN_TERMS.stream().anyMatch(term -> containsIgnoreCase(token, term))) return true;
        return token.matches(".*(工程师|开发|算法|数据|产品|运营|设计|实习|项目|课程|竞赛|证书|本科|硕士|博士|学校|大学|学院|专业|面试|简历|校招|转行|英语).*");
    }

    private void addTimeTokens(String label, Set<String> out) {
        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("(?<!\\d)((?:19|20)\\d{2})(?:[./年-]?(0?[1-9]|1[0-2])月?)?")
                .matcher(label);
        while (matcher.find()) {
            String year = matcher.group(1);
            String month = matcher.group(2);
            out.add(month == null ? year : year + "." + month.replaceFirst("^0", ""));
        }
    }

    private String normalizeLabel(String value) {
        return value == null ? "" : value
                .replace("：", ":")
                .replaceAll("(?i)^resume status:", "")
                .replaceAll("^简历状态[:：]?", "")
                .replaceAll("^目标岗位[:：]?", "")
                .replaceAll("\\d+\\s*分$", "")
                .replaceAll("^[,.;:!?，。；：！？]+|[,.;:!?，。；：！？]+$", "")
                .trim();
    }

    private boolean isUsefulToken(String token) {
        if (!hasText(token)) return false;
        String clean = normalizeLabel(token);
        if (clean.length() < 2 && !clean.matches("AI|UI|UX")) return false;
        if (clean.length() > 24) return false;
        if (isContactLike(clean)) return false;
        if (clean.matches("(?i).*(email|mail|phone|mobile|wechat|weixin|github|linkedin).*")) return false;
        if (clean.matches("\\+?\\d{2,}[-\\d\\s]{4,}")) return false;
        if (clean.matches("\\d+(?:\\.\\d+)+") && !clean.matches("(?:19|20)\\d{2}(?:\\.\\d{1,2})?")) return false;
        if (clean.matches("\\d+") && !clean.matches("(19|20)\\d{2}")) return false;
        return !TOKEN_STOPWORDS.contains(clean) && !TOKEN_STOPWORDS.contains(clean.toLowerCase(Locale.ROOT));
    }

    private boolean isContactLike(String value) {
        if (!hasText(value)) return false;
        String clean = normalizeLabel(value);
        String lower = clean.toLowerCase(Locale.ROOT);
        if (CONTACT_TOKENS.contains(lower)) return true;
        if (lower.contains("@")) return true;
        if (lower.matches("https?://.*|www\\..*")) return true;
        if (lower.matches("\\+?86")) return true;
        return lower.matches("\\+?\\d[\\d\\s-]{6,}\\d");
    }

    private boolean isTimeToken(String value) {
        if (!hasText(value)) return false;
        String clean = normalizeLabel(value);
        return clean.matches("(?:19|20)\\d{2}(?:\\.\\d{1,2})?");
    }

    private boolean containsIgnoreCase(String text, String term) {
        return text.toLowerCase(Locale.ROOT).contains(term.toLowerCase(Locale.ROOT));
    }

    private UserProfileTagDto sanitize(UserProfileTagDto dto) {
        if (!CATEGORY_ORDER.contains(dto.getCategory())) return null;
        if (!hasText(dto.getLabel())) return null;
        String label = dto.getLabel().trim();
        if (label.length() > 60) label = label.substring(0, 60);
        return UserProfileTagDto.builder()
                .category(dto.getCategory())
                .label(label)
                .weight(dto.getWeight())
                .evidence(dto.getEvidence())
                .build();
    }

    private UserProfileTagDto.Summary buildSummary(List<UserProfileTagDto> tags) {
        Map<String, List<UserProfileTagDto>> sections = new LinkedHashMap<>();
        for (String category : CATEGORY_ORDER) sections.put(category, new ArrayList<>());
        for (UserProfileTagDto tag : tags) {
            sections.computeIfAbsent(tag.getCategory(), ignored -> new ArrayList<>()).add(tag);
        }
        sections.replaceAll((k, v) -> v.stream()
                .sorted(Comparator.comparing(UserProfileTagDto::getWeight, Comparator.nullsLast(Integer::compareTo)).reversed())
                .toList());
        return UserProfileTagDto.Summary.builder().tags(tags).sections(sections).build();
    }

    private UserProfileTagDto toDto(UserProfileTag tag) {
        return UserProfileTagDto.builder()
                .tagId(tag.getTagId())
                .category(tag.getCategory())
                .label(tag.getLabel())
                .weight(tag.getWeight())
                .source(tag.getSource())
                .evidence(tag.getEvidence())
                .editable(tag.getEditable())
                .build();
    }

    private UserProfileTagDto toDto(ResumeProfileKeyword keyword) {
        return UserProfileTagDto.builder()
                .category(keyword.getCategory())
                .label(keyword.getLabel())
                .weight(keyword.getWeight())
                .source(keyword.getSource())
                .evidence(keyword.getEvidence())
                .editable(true)
                .build();
    }

    private int weightFromScore(int score) {
        return clamp(score, 30, 95);
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private record TagSpec(String category, String label, int weight, String evidence) {}
}
