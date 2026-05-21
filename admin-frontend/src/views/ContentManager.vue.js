import { ref, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import http from '@/api';
const activeTab = ref('videos');
// ── Videos ──────────────────────────────────────
const videos = ref([]);
const loadingVideos = ref(false);
const videoPage = ref(1);
const videoPageSize = ref(20);
const videoTotal = ref(0);
const loadVideos = async () => {
    loadingVideos.value = true;
    try {
        const data = await http.get('/api/admin/content/videos', {
            params: { page: videoPage.value - 1, size: videoPageSize.value }
        });
        videos.value = data.content;
        videoTotal.value = data.totalElements;
    }
    catch (e) {
        ElMessage.error(e?.message || '加载失败');
    }
    finally {
        loadingVideos.value = false;
    }
};
const deleteVideo = async (row) => {
    await ElMessageBox.confirm(`确认删除视频「${row.title}」？`, '警告', { type: 'warning' });
    try {
        await http.delete(`/api/admin/content/videos/${row.id}`);
        ElMessage.success('已删除');
        loadVideos();
    }
    catch (e) {
        ElMessage.error(e?.message || '删除失败');
    }
};
// ── Articles ─────────────────────────────────────
const articles = ref([]);
const loadingArticles = ref(false);
const articleDialog = ref(false);
const savingArticle = ref(false);
const editingArticle = ref(null);
const articleForm = ref({ title: '', summary: '', sourceUrl: '', imageUrl: '', category: 'career' });
const loadArticles = async () => {
    loadingArticles.value = true;
    try {
        articles.value = await http.get('/api/admin/content/articles');
    }
    catch (e) {
        ElMessage.error(e?.message || '加载失败');
    }
    finally {
        loadingArticles.value = false;
    }
};
const openArticleDialog = (row) => {
    editingArticle.value = row;
    articleForm.value = row ? { ...row } : { title: '', summary: '', sourceUrl: '', imageUrl: '', category: 'career' };
    articleDialog.value = true;
};
const saveArticle = async () => {
    if (!articleForm.value.title?.trim()) {
        ElMessage.warning('标题不能为空');
        return;
    }
    savingArticle.value = true;
    try {
        if (editingArticle.value?.id) {
            await http.put(`/api/admin/content/articles/${editingArticle.value.id}`, articleForm.value);
        }
        else {
            await http.post('/api/admin/content/articles', articleForm.value);
        }
        ElMessage.success('保存成功');
        articleDialog.value = false;
        loadArticles();
    }
    catch (e) {
        ElMessage.error(e?.message || '保存失败');
    }
    finally {
        savingArticle.value = false;
    }
};
const deleteArticle = async (row) => {
    await ElMessageBox.confirm(`确认删除文章「${row.title}」？`, '警告', { type: 'warning' });
    try {
        await http.delete(`/api/admin/content/articles/${row.id}`);
        ElMessage.success('已删除');
        loadArticles();
    }
    catch (e) {
        ElMessage.error(e?.message || '删除失败');
    }
};
const fmtNum = (n) => n == null ? '-' : n.toLocaleString();
const sourceLabel = (source) => ({ MANUAL: '手动', RSS_JUEJIN: '掘金', RSS_36KR: '36氪' }[source ?? ''] ?? source ?? '-');
const sourceTagType = (source) => ({ MANUAL: 'success', RSS_JUEJIN: 'primary', RSS_36KR: 'warning' }[source ?? ''] ?? '');
const togglePin = async (row) => {
    try {
        const updated = await http.patch(`/api/admin/content/articles/${row.id}/pin`);
        row.pinned = updated.pinned;
        ElMessage.success(updated.pinned ? '已置顶' : '已取消置顶');
    }
    catch (e) {
        ElMessage.error(e?.message || '操作失败');
    }
};
const toggleHide = async (row) => {
    try {
        const updated = await http.patch(`/api/admin/content/articles/${row.id}/hide`);
        row.hidden = updated.hidden;
        ElMessage.success(updated.hidden ? '已隐藏' : '已取消隐藏');
    }
    catch (e) {
        ElMessage.error(e?.message || '操作失败');
    }
};
watch(activeTab, (tab) => {
    if (tab === 'videos')
        loadVideos();
    else if (tab === 'articles')
        loadArticles();
});
onMounted(() => loadVideos());
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
const __VLS_0 = {}.ElTabs;
/** @type {[typeof __VLS_components.ElTabs, typeof __VLS_components.elTabs, typeof __VLS_components.ElTabs, typeof __VLS_components.elTabs, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.activeTab),
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.activeTab),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.ElTabPane;
/** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    label: "首页视频",
    name: "videos",
}));
const __VLS_6 = __VLS_5({
    label: "首页视频",
    name: "videos",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    data: (__VLS_ctx.videos),
    stripe: true,
    border: true,
    ...{ style: {} },
}));
const __VLS_10 = __VLS_9({
    data: (__VLS_ctx.videos),
    stripe: true,
    border: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loadingVideos) }, null, null);
__VLS_11.slots.default;
const __VLS_12 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    prop: "id",
    label: "ID",
    width: "70",
}));
const __VLS_14 = __VLS_13({
    prop: "id",
    label: "ID",
    width: "70",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const __VLS_16 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    prop: "title",
    label: "标题",
    showOverflowTooltip: true,
}));
const __VLS_18 = __VLS_17({
    prop: "title",
    label: "标题",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const __VLS_20 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    prop: "upName",
    label: "UP主",
    width: "140",
}));
const __VLS_22 = __VLS_21({
    prop: "upName",
    label: "UP主",
    width: "140",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const __VLS_24 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    prop: "keyword",
    label: "关键词",
    width: "110",
}));
const __VLS_26 = __VLS_25({
    prop: "keyword",
    label: "关键词",
    width: "110",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const __VLS_28 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    label: "播放量",
    width: "110",
}));
const __VLS_30 = __VLS_29({
    label: "播放量",
    width: "110",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_31.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    (__VLS_ctx.fmtNum(row.viewCount));
}
var __VLS_31;
const __VLS_32 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    prop: "fetchedAt",
    label: "抓取时间",
    width: "175",
}));
const __VLS_34 = __VLS_33({
    prop: "fetchedAt",
    label: "抓取时间",
    width: "175",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const __VLS_36 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    label: "操作",
    width: "100",
    fixed: "right",
}));
const __VLS_38 = __VLS_37({
    label: "操作",
    width: "100",
    fixed: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_39.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_40 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
    }));
    const __VLS_42 = __VLS_41({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    let __VLS_44;
    let __VLS_45;
    let __VLS_46;
    const __VLS_47 = {
        onClick: (...[$event]) => {
            __VLS_ctx.deleteVideo(row);
        }
    };
    __VLS_43.slots.default;
    var __VLS_43;
}
var __VLS_39;
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pager" },
});
const __VLS_48 = {}.ElPagination;
/** @type {[typeof __VLS_components.ElPagination, typeof __VLS_components.elPagination, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    ...{ 'onCurrentChange': {} },
    currentPage: (__VLS_ctx.videoPage),
    pageSize: (__VLS_ctx.videoPageSize),
    total: (__VLS_ctx.videoTotal),
    layout: "total, prev, pager, next",
}));
const __VLS_50 = __VLS_49({
    ...{ 'onCurrentChange': {} },
    currentPage: (__VLS_ctx.videoPage),
    pageSize: (__VLS_ctx.videoPageSize),
    total: (__VLS_ctx.videoTotal),
    layout: "total, prev, pager, next",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
let __VLS_52;
let __VLS_53;
let __VLS_54;
const __VLS_55 = {
    onCurrentChange: (__VLS_ctx.loadVideos)
};
var __VLS_51;
var __VLS_7;
const __VLS_56 = {}.ElTabPane;
/** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    label: "首页文章",
    name: "articles",
}));
const __VLS_58 = __VLS_57({
    label: "首页文章",
    name: "articles",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar" },
});
const __VLS_60 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_62 = __VLS_61({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
let __VLS_64;
let __VLS_65;
let __VLS_66;
const __VLS_67 = {
    onClick: (...[$event]) => {
        __VLS_ctx.openArticleDialog(null);
    }
};
__VLS_63.slots.default;
var __VLS_63;
const __VLS_68 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    data: (__VLS_ctx.articles),
    stripe: true,
    border: true,
    ...{ style: {} },
}));
const __VLS_70 = __VLS_69({
    data: (__VLS_ctx.articles),
    stripe: true,
    border: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loadingArticles) }, null, null);
__VLS_71.slots.default;
const __VLS_72 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    prop: "id",
    label: "ID",
    width: "60",
}));
const __VLS_74 = __VLS_73({
    prop: "id",
    label: "ID",
    width: "60",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
const __VLS_76 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    label: "标题",
    showOverflowTooltip: true,
    minWidth: "200",
}));
const __VLS_78 = __VLS_77({
    label: "标题",
    showOverflowTooltip: true,
    minWidth: "200",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_79.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (row.pinned) {
        const __VLS_80 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
            type: "warning",
            size: "small",
            ...{ style: {} },
        }));
        const __VLS_82 = __VLS_81({
            type: "warning",
            size: "small",
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        __VLS_83.slots.default;
        var __VLS_83;
    }
    if (row.hidden) {
        const __VLS_84 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
            type: "info",
            size: "small",
            ...{ style: {} },
        }));
        const __VLS_86 = __VLS_85({
            type: "info",
            size: "small",
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_85));
        __VLS_87.slots.default;
        var __VLS_87;
    }
    (row.title);
}
var __VLS_79;
const __VLS_88 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    label: "来源",
    width: "110",
}));
const __VLS_90 = __VLS_89({
    label: "来源",
    width: "110",
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
__VLS_91.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_91.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_92 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        type: (__VLS_ctx.sourceTagType(row.source)),
        size: "small",
    }));
    const __VLS_94 = __VLS_93({
        type: (__VLS_ctx.sourceTagType(row.source)),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    __VLS_95.slots.default;
    (__VLS_ctx.sourceLabel(row.source));
    var __VLS_95;
}
var __VLS_91;
const __VLS_96 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    prop: "category",
    label: "分类",
    width: "90",
}));
const __VLS_98 = __VLS_97({
    prop: "category",
    label: "分类",
    width: "90",
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
const __VLS_100 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    prop: "publishedAt",
    label: "发布时间",
    width: "160",
}));
const __VLS_102 = __VLS_101({
    prop: "publishedAt",
    label: "发布时间",
    width: "160",
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
const __VLS_104 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
    label: "操作",
    width: "280",
    fixed: "right",
}));
const __VLS_106 = __VLS_105({
    label: "操作",
    width: "280",
    fixed: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
__VLS_107.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_107.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_108 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
        ...{ 'onClick': {} },
        size: "small",
        type: (row.pinned ? 'warning' : ''),
    }));
    const __VLS_110 = __VLS_109({
        ...{ 'onClick': {} },
        size: "small",
        type: (row.pinned ? 'warning' : ''),
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    let __VLS_112;
    let __VLS_113;
    let __VLS_114;
    const __VLS_115 = {
        onClick: (...[$event]) => {
            __VLS_ctx.togglePin(row);
        }
    };
    __VLS_111.slots.default;
    (row.pinned ? '取消置顶' : '置顶');
    var __VLS_111;
    const __VLS_116 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
        ...{ 'onClick': {} },
        size: "small",
        type: (row.hidden ? '' : 'info'),
    }));
    const __VLS_118 = __VLS_117({
        ...{ 'onClick': {} },
        size: "small",
        type: (row.hidden ? '' : 'info'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_117));
    let __VLS_120;
    let __VLS_121;
    let __VLS_122;
    const __VLS_123 = {
        onClick: (...[$event]) => {
            __VLS_ctx.toggleHide(row);
        }
    };
    __VLS_119.slots.default;
    (row.hidden ? '取消隐藏' : '隐藏');
    var __VLS_119;
    const __VLS_124 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        ...{ 'onClick': {} },
        size: "small",
    }));
    const __VLS_126 = __VLS_125({
        ...{ 'onClick': {} },
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
    let __VLS_128;
    let __VLS_129;
    let __VLS_130;
    const __VLS_131 = {
        onClick: (...[$event]) => {
            __VLS_ctx.openArticleDialog(row);
        }
    };
    __VLS_127.slots.default;
    var __VLS_127;
    const __VLS_132 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
    }));
    const __VLS_134 = __VLS_133({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_133));
    let __VLS_136;
    let __VLS_137;
    let __VLS_138;
    const __VLS_139 = {
        onClick: (...[$event]) => {
            __VLS_ctx.deleteArticle(row);
        }
    };
    __VLS_135.slots.default;
    var __VLS_135;
}
var __VLS_107;
var __VLS_71;
var __VLS_59;
var __VLS_3;
const __VLS_140 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
    modelValue: (__VLS_ctx.articleDialog),
    title: (__VLS_ctx.editingArticle?.id ? '编辑文章' : '新增文章'),
    width: "560px",
}));
const __VLS_142 = __VLS_141({
    modelValue: (__VLS_ctx.articleDialog),
    title: (__VLS_ctx.editingArticle?.id ? '编辑文章' : '新增文章'),
    width: "560px",
}, ...__VLS_functionalComponentArgsRest(__VLS_141));
__VLS_143.slots.default;
const __VLS_144 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
    model: (__VLS_ctx.articleForm),
    labelPosition: "top",
}));
const __VLS_146 = __VLS_145({
    model: (__VLS_ctx.articleForm),
    labelPosition: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_145));
__VLS_147.slots.default;
const __VLS_148 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
    label: "标题 *",
}));
const __VLS_150 = __VLS_149({
    label: "标题 *",
}, ...__VLS_functionalComponentArgsRest(__VLS_149));
__VLS_151.slots.default;
const __VLS_152 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
    modelValue: (__VLS_ctx.articleForm.title),
}));
const __VLS_154 = __VLS_153({
    modelValue: (__VLS_ctx.articleForm.title),
}, ...__VLS_functionalComponentArgsRest(__VLS_153));
var __VLS_151;
const __VLS_156 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
    label: "摘要",
}));
const __VLS_158 = __VLS_157({
    label: "摘要",
}, ...__VLS_functionalComponentArgsRest(__VLS_157));
__VLS_159.slots.default;
const __VLS_160 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
    modelValue: (__VLS_ctx.articleForm.summary),
    type: "textarea",
    rows: (2),
}));
const __VLS_162 = __VLS_161({
    modelValue: (__VLS_ctx.articleForm.summary),
    type: "textarea",
    rows: (2),
}, ...__VLS_functionalComponentArgsRest(__VLS_161));
var __VLS_159;
const __VLS_164 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    label: "链接 *",
}));
const __VLS_166 = __VLS_165({
    label: "链接 *",
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
__VLS_167.slots.default;
const __VLS_168 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
    modelValue: (__VLS_ctx.articleForm.sourceUrl),
    placeholder: "https://…",
}));
const __VLS_170 = __VLS_169({
    modelValue: (__VLS_ctx.articleForm.sourceUrl),
    placeholder: "https://…",
}, ...__VLS_functionalComponentArgsRest(__VLS_169));
var __VLS_167;
const __VLS_172 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
    label: "封面图 URL",
}));
const __VLS_174 = __VLS_173({
    label: "封面图 URL",
}, ...__VLS_functionalComponentArgsRest(__VLS_173));
__VLS_175.slots.default;
const __VLS_176 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
    modelValue: (__VLS_ctx.articleForm.imageUrl),
    placeholder: "https://…",
}));
const __VLS_178 = __VLS_177({
    modelValue: (__VLS_ctx.articleForm.imageUrl),
    placeholder: "https://…",
}, ...__VLS_functionalComponentArgsRest(__VLS_177));
var __VLS_175;
const __VLS_180 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
    label: "分类",
}));
const __VLS_182 = __VLS_181({
    label: "分类",
}, ...__VLS_functionalComponentArgsRest(__VLS_181));
__VLS_183.slots.default;
const __VLS_184 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
    modelValue: (__VLS_ctx.articleForm.category),
    ...{ style: {} },
}));
const __VLS_186 = __VLS_185({
    modelValue: (__VLS_ctx.articleForm.category),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_185));
__VLS_187.slots.default;
const __VLS_188 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
    label: "interview",
    value: "interview",
}));
const __VLS_190 = __VLS_189({
    label: "interview",
    value: "interview",
}, ...__VLS_functionalComponentArgsRest(__VLS_189));
const __VLS_192 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_193 = __VLS_asFunctionalComponent(__VLS_192, new __VLS_192({
    label: "resume",
    value: "resume",
}));
const __VLS_194 = __VLS_193({
    label: "resume",
    value: "resume",
}, ...__VLS_functionalComponentArgsRest(__VLS_193));
const __VLS_196 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
    label: "skill",
    value: "skill",
}));
const __VLS_198 = __VLS_197({
    label: "skill",
    value: "skill",
}, ...__VLS_functionalComponentArgsRest(__VLS_197));
const __VLS_200 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({
    label: "career",
    value: "career",
}));
const __VLS_202 = __VLS_201({
    label: "career",
    value: "career",
}, ...__VLS_functionalComponentArgsRest(__VLS_201));
const __VLS_204 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
    label: "other",
    value: "other",
}));
const __VLS_206 = __VLS_205({
    label: "other",
    value: "other",
}, ...__VLS_functionalComponentArgsRest(__VLS_205));
var __VLS_187;
var __VLS_183;
var __VLS_147;
{
    const { footer: __VLS_thisSlot } = __VLS_143.slots;
    const __VLS_208 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
        ...{ 'onClick': {} },
    }));
    const __VLS_210 = __VLS_209({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_209));
    let __VLS_212;
    let __VLS_213;
    let __VLS_214;
    const __VLS_215 = {
        onClick: (...[$event]) => {
            __VLS_ctx.articleDialog = false;
        }
    };
    __VLS_211.slots.default;
    var __VLS_211;
    const __VLS_216 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_217 = __VLS_asFunctionalComponent(__VLS_216, new __VLS_216({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.savingArticle),
    }));
    const __VLS_218 = __VLS_217({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.savingArticle),
    }, ...__VLS_functionalComponentArgsRest(__VLS_217));
    let __VLS_220;
    let __VLS_221;
    let __VLS_222;
    const __VLS_223 = {
        onClick: (__VLS_ctx.saveArticle)
    };
    __VLS_219.slots.default;
    var __VLS_219;
}
var __VLS_143;
/** @type {__VLS_StyleScopedClasses['pager']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            activeTab: activeTab,
            videos: videos,
            loadingVideos: loadingVideos,
            videoPage: videoPage,
            videoPageSize: videoPageSize,
            videoTotal: videoTotal,
            loadVideos: loadVideos,
            deleteVideo: deleteVideo,
            articles: articles,
            loadingArticles: loadingArticles,
            articleDialog: articleDialog,
            savingArticle: savingArticle,
            editingArticle: editingArticle,
            articleForm: articleForm,
            openArticleDialog: openArticleDialog,
            saveArticle: saveArticle,
            deleteArticle: deleteArticle,
            fmtNum: fmtNum,
            sourceLabel: sourceLabel,
            sourceTagType: sourceTagType,
            togglePin: togglePin,
            toggleHide: toggleHide,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
