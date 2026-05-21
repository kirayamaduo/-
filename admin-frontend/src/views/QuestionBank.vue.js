import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { api } from '@/api';
const activeTab = ref('all');
const allItems = ref([]);
const pendingItems = ref([]);
const filter = ref('');
const sourceFilter = ref('');
const dialogVisible = ref(false);
const form = reactive({
    id: undefined, position: '', difficulty: 'Normal', content: '', summary: '', answer: '', status: 'APPROVED'
});
const filteredAll = computed(() => {
    let list = allItems.value;
    if (sourceFilter.value)
        list = list.filter(i => i.source === sourceFilter.value);
    if (!filter.value)
        return list;
    const q = filter.value.toLowerCase();
    return list.filter(i => (i.position || '').toLowerCase().includes(q) || (i.content || '').toLowerCase().includes(q));
});
const sourceTagType = (source) => {
    if (source === 'OFFICIAL')
        return 'success';
    if (source === 'AI_GENERATED')
        return 'warning';
    return 'info';
};
const loadAll = async () => {
    try {
        allItems.value = (await api.listQuestions());
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed');
    }
};
const loadPending = async () => {
    try {
        pendingItems.value = (await api.listPendingReview());
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed');
    }
};
const onTabChange = (tab) => {
    if (tab === 'review')
        loadPending();
};
const edit = (row) => {
    Object.assign(form, row);
    dialogVisible.value = true;
};
const save = async () => {
    if (!form.id)
        return;
    try {
        await api.updateQuestion(form.id, form);
        dialogVisible.value = false;
        ElMessage.success('Saved');
        loadAll();
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed');
    }
};
const setStatus = async (row, status) => {
    if (!row.id)
        return;
    try {
        await api.updateQuestion(row.id, { status });
        ElMessage.success(status === 'HIDDEN' ? 'Hidden' : 'Shown');
        loadAll();
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed');
    }
};
const approve = async (row) => {
    if (!row.id)
        return;
    try {
        await api.approveQuestion(row.id);
        ElMessage.success('Question approved and published');
        loadPending();
        loadAll();
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed');
    }
};
const reject = async (row) => {
    if (!row.id)
        return;
    try {
        await ElMessageBox.confirm('Reject and hide this question?', 'Confirm', { type: 'warning' });
        await api.rejectQuestion(row.id);
        ElMessage.success('Question rejected');
        loadPending();
    }
    catch { }
};
const remove = async (row) => {
    if (!row.id)
        return;
    try {
        await ElMessageBox.confirm('Delete this question?', 'Confirm', { type: 'warning' });
        await api.deleteQuestion(row.id);
        ElMessage.success('Deleted');
        loadAll();
    }
    catch { }
};
onMounted(loadAll);
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
    ...{ 'onTabChange': {} },
    modelValue: (__VLS_ctx.activeTab),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onTabChange': {} },
    modelValue: (__VLS_ctx.activeTab),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onTabChange: (__VLS_ctx.onTabChange)
};
__VLS_3.slots.default;
const __VLS_8 = {}.ElTabPane;
/** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    label: "All Questions",
    name: "all",
}));
const __VLS_10 = __VLS_9({
    label: "All Questions",
    name: "all",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({}));
const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row-controls" },
});
const __VLS_16 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.filter),
    placeholder: "Filter by position or content...",
    clearable: true,
    ...{ style: {} },
}));
const __VLS_18 = __VLS_17({
    modelValue: (__VLS_ctx.filter),
    placeholder: "Filter by position or content...",
    clearable: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const __VLS_20 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    modelValue: (__VLS_ctx.sourceFilter),
    placeholder: "Source",
    clearable: true,
    ...{ style: {} },
}));
const __VLS_22 = __VLS_21({
    modelValue: (__VLS_ctx.sourceFilter),
    placeholder: "Source",
    clearable: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
const __VLS_24 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    label: "All Sources",
    value: "",
}));
const __VLS_26 = __VLS_25({
    label: "All Sources",
    value: "",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const __VLS_28 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    label: "Official",
    value: "OFFICIAL",
}));
const __VLS_30 = __VLS_29({
    label: "Official",
    value: "OFFICIAL",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
const __VLS_32 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    label: "User",
    value: "USER",
}));
const __VLS_34 = __VLS_33({
    label: "User",
    value: "USER",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const __VLS_36 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    label: "AI Generated",
    value: "AI_GENERATED",
}));
const __VLS_38 = __VLS_37({
    label: "AI Generated",
    value: "AI_GENERATED",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
var __VLS_23;
const __VLS_40 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    ...{ 'onClick': {} },
}));
const __VLS_42 = __VLS_41({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
let __VLS_44;
let __VLS_45;
let __VLS_46;
const __VLS_47 = {
    onClick: (__VLS_ctx.loadAll)
};
__VLS_43.slots.default;
var __VLS_43;
var __VLS_15;
const __VLS_48 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    ...{ style: {} },
}));
const __VLS_50 = __VLS_49({
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
const __VLS_52 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    data: (__VLS_ctx.filteredAll),
    stripe: true,
}));
const __VLS_54 = __VLS_53({
    data: (__VLS_ctx.filteredAll),
    stripe: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
const __VLS_56 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    prop: "id",
    label: "ID",
    width: "70",
}));
const __VLS_58 = __VLS_57({
    prop: "id",
    label: "ID",
    width: "70",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
const __VLS_60 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    prop: "position",
    label: "Position",
    width: "180",
}));
const __VLS_62 = __VLS_61({
    prop: "position",
    label: "Position",
    width: "180",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
const __VLS_64 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    prop: "difficulty",
    label: "Difficulty",
    width: "100",
}));
const __VLS_66 = __VLS_65({
    prop: "difficulty",
    label: "Difficulty",
    width: "100",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
const __VLS_68 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    prop: "content",
    label: "Content",
}));
const __VLS_70 = __VLS_69({
    prop: "content",
    label: "Content",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
const __VLS_72 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    prop: "source",
    label: "Source",
    width: "110",
}));
const __VLS_74 = __VLS_73({
    prop: "source",
    label: "Source",
    width: "110",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_75.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_76 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        type: (__VLS_ctx.sourceTagType(row.source)),
        size: "small",
    }));
    const __VLS_78 = __VLS_77({
        type: (__VLS_ctx.sourceTagType(row.source)),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    __VLS_79.slots.default;
    (row.source);
    var __VLS_79;
}
var __VLS_75;
const __VLS_80 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    prop: "status",
    label: "Status",
    width: "90",
}));
const __VLS_82 = __VLS_81({
    prop: "status",
    label: "Status",
    width: "90",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
const __VLS_84 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    label: "Actions",
    width: "220",
}));
const __VLS_86 = __VLS_85({
    label: "Actions",
    width: "220",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
__VLS_87.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_87.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_88 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        ...{ 'onClick': {} },
        size: "small",
    }));
    const __VLS_90 = __VLS_89({
        ...{ 'onClick': {} },
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    let __VLS_92;
    let __VLS_93;
    let __VLS_94;
    const __VLS_95 = {
        onClick: (...[$event]) => {
            __VLS_ctx.edit(row);
        }
    };
    __VLS_91.slots.default;
    var __VLS_91;
    if (row.status === 'APPROVED') {
        const __VLS_96 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
            ...{ 'onClick': {} },
            size: "small",
        }));
        const __VLS_98 = __VLS_97({
            ...{ 'onClick': {} },
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
        let __VLS_100;
        let __VLS_101;
        let __VLS_102;
        const __VLS_103 = {
            onClick: (...[$event]) => {
                if (!(row.status === 'APPROVED'))
                    return;
                __VLS_ctx.setStatus(row, 'HIDDEN');
            }
        };
        __VLS_99.slots.default;
        var __VLS_99;
    }
    else {
        const __VLS_104 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
            ...{ 'onClick': {} },
            size: "small",
        }));
        const __VLS_106 = __VLS_105({
            ...{ 'onClick': {} },
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_105));
        let __VLS_108;
        let __VLS_109;
        let __VLS_110;
        const __VLS_111 = {
            onClick: (...[$event]) => {
                if (!!(row.status === 'APPROVED'))
                    return;
                __VLS_ctx.setStatus(row, 'APPROVED');
            }
        };
        __VLS_107.slots.default;
        var __VLS_107;
    }
    const __VLS_112 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
    }));
    const __VLS_114 = __VLS_113({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    let __VLS_116;
    let __VLS_117;
    let __VLS_118;
    const __VLS_119 = {
        onClick: (...[$event]) => {
            __VLS_ctx.remove(row);
        }
    };
    __VLS_115.slots.default;
    var __VLS_115;
}
var __VLS_87;
var __VLS_55;
var __VLS_51;
var __VLS_11;
const __VLS_120 = {}.ElTabPane;
/** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
    name: "review",
}));
const __VLS_122 = __VLS_121({
    name: "review",
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
__VLS_123.slots.default;
{
    const { label: __VLS_thisSlot } = __VLS_123.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    const __VLS_124 = {}.ElBadge;
    /** @type {[typeof __VLS_components.ElBadge, typeof __VLS_components.elBadge, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        value: (__VLS_ctx.pendingItems.length),
        max: (99),
        type: "danger",
        ...{ style: {} },
    }));
    const __VLS_126 = __VLS_125({
        value: (__VLS_ctx.pendingItems.length),
        max: (99),
        type: "danger",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
}
const __VLS_128 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({}));
const __VLS_130 = __VLS_129({}, ...__VLS_functionalComponentArgsRest(__VLS_129));
__VLS_131.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row-controls" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "review-hint" },
});
const __VLS_132 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    ...{ 'onClick': {} },
}));
const __VLS_134 = __VLS_133({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
let __VLS_136;
let __VLS_137;
let __VLS_138;
const __VLS_139 = {
    onClick: (__VLS_ctx.loadPending)
};
__VLS_135.slots.default;
var __VLS_135;
var __VLS_131;
const __VLS_140 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
    ...{ style: {} },
}));
const __VLS_142 = __VLS_141({
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_141));
__VLS_143.slots.default;
if (__VLS_ctx.pendingItems.length === 0) {
    const __VLS_144 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
        description: "No questions pending review 🎉",
    }));
    const __VLS_146 = __VLS_145({
        description: "No questions pending review 🎉",
    }, ...__VLS_functionalComponentArgsRest(__VLS_145));
}
else {
    const __VLS_148 = {}.ElTable;
    /** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
    // @ts-ignore
    const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
        data: (__VLS_ctx.pendingItems),
        stripe: true,
    }));
    const __VLS_150 = __VLS_149({
        data: (__VLS_ctx.pendingItems),
        stripe: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_149));
    __VLS_151.slots.default;
    const __VLS_152 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
        prop: "id",
        label: "ID",
        width: "70",
    }));
    const __VLS_154 = __VLS_153({
        prop: "id",
        label: "ID",
        width: "70",
    }, ...__VLS_functionalComponentArgsRest(__VLS_153));
    const __VLS_156 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
        prop: "position",
        label: "Position",
        width: "160",
    }));
    const __VLS_158 = __VLS_157({
        prop: "position",
        label: "Position",
        width: "160",
    }, ...__VLS_functionalComponentArgsRest(__VLS_157));
    const __VLS_160 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
        prop: "difficulty",
        label: "Diff",
        width: "80",
    }));
    const __VLS_162 = __VLS_161({
        prop: "difficulty",
        label: "Diff",
        width: "80",
    }, ...__VLS_functionalComponentArgsRest(__VLS_161));
    const __VLS_164 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
        prop: "content",
        label: "Question",
    }));
    const __VLS_166 = __VLS_165({
        prop: "content",
        label: "Question",
    }, ...__VLS_functionalComponentArgsRest(__VLS_165));
    const __VLS_168 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
        prop: "answer",
        label: "Reference Answer",
        width: "260",
        showOverflowTooltip: true,
    }));
    const __VLS_170 = __VLS_169({
        prop: "answer",
        label: "Reference Answer",
        width: "260",
        showOverflowTooltip: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_169));
    const __VLS_172 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
        label: "Actions",
        width: "180",
    }));
    const __VLS_174 = __VLS_173({
        label: "Actions",
        width: "180",
    }, ...__VLS_functionalComponentArgsRest(__VLS_173));
    __VLS_175.slots.default;
    {
        const { default: __VLS_thisSlot } = __VLS_175.slots;
        const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
        const __VLS_176 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
            ...{ 'onClick': {} },
            size: "small",
            type: "success",
        }));
        const __VLS_178 = __VLS_177({
            ...{ 'onClick': {} },
            size: "small",
            type: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_177));
        let __VLS_180;
        let __VLS_181;
        let __VLS_182;
        const __VLS_183 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.pendingItems.length === 0))
                    return;
                __VLS_ctx.approve(row);
            }
        };
        __VLS_179.slots.default;
        var __VLS_179;
        const __VLS_184 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
            ...{ 'onClick': {} },
            size: "small",
            type: "danger",
        }));
        const __VLS_186 = __VLS_185({
            ...{ 'onClick': {} },
            size: "small",
            type: "danger",
        }, ...__VLS_functionalComponentArgsRest(__VLS_185));
        let __VLS_188;
        let __VLS_189;
        let __VLS_190;
        const __VLS_191 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.pendingItems.length === 0))
                    return;
                __VLS_ctx.reject(row);
            }
        };
        __VLS_187.slots.default;
        var __VLS_187;
    }
    var __VLS_175;
    var __VLS_151;
}
var __VLS_143;
var __VLS_123;
var __VLS_3;
const __VLS_192 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_193 = __VLS_asFunctionalComponent(__VLS_192, new __VLS_192({
    modelValue: (__VLS_ctx.dialogVisible),
    title: "Edit question",
    width: "640px",
}));
const __VLS_194 = __VLS_193({
    modelValue: (__VLS_ctx.dialogVisible),
    title: "Edit question",
    width: "640px",
}, ...__VLS_functionalComponentArgsRest(__VLS_193));
__VLS_195.slots.default;
const __VLS_196 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
    model: (__VLS_ctx.form),
    labelPosition: "top",
}));
const __VLS_198 = __VLS_197({
    model: (__VLS_ctx.form),
    labelPosition: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_197));
__VLS_199.slots.default;
const __VLS_200 = {}.ElRow;
/** @type {[typeof __VLS_components.ElRow, typeof __VLS_components.elRow, typeof __VLS_components.ElRow, typeof __VLS_components.elRow, ]} */ ;
// @ts-ignore
const __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({
    gutter: (12),
}));
const __VLS_202 = __VLS_201({
    gutter: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_201));
__VLS_203.slots.default;
const __VLS_204 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
    span: (12),
}));
const __VLS_206 = __VLS_205({
    span: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_205));
__VLS_207.slots.default;
const __VLS_208 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
    label: "Position",
}));
const __VLS_210 = __VLS_209({
    label: "Position",
}, ...__VLS_functionalComponentArgsRest(__VLS_209));
__VLS_211.slots.default;
const __VLS_212 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
    modelValue: (__VLS_ctx.form.position),
}));
const __VLS_214 = __VLS_213({
    modelValue: (__VLS_ctx.form.position),
}, ...__VLS_functionalComponentArgsRest(__VLS_213));
var __VLS_211;
var __VLS_207;
const __VLS_216 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_217 = __VLS_asFunctionalComponent(__VLS_216, new __VLS_216({
    span: (6),
}));
const __VLS_218 = __VLS_217({
    span: (6),
}, ...__VLS_functionalComponentArgsRest(__VLS_217));
__VLS_219.slots.default;
const __VLS_220 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({
    label: "Difficulty",
}));
const __VLS_222 = __VLS_221({
    label: "Difficulty",
}, ...__VLS_functionalComponentArgsRest(__VLS_221));
__VLS_223.slots.default;
const __VLS_224 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_225 = __VLS_asFunctionalComponent(__VLS_224, new __VLS_224({
    modelValue: (__VLS_ctx.form.difficulty),
}));
const __VLS_226 = __VLS_225({
    modelValue: (__VLS_ctx.form.difficulty),
}, ...__VLS_functionalComponentArgsRest(__VLS_225));
__VLS_227.slots.default;
const __VLS_228 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_229 = __VLS_asFunctionalComponent(__VLS_228, new __VLS_228({
    label: "Easy",
    value: "Easy",
}));
const __VLS_230 = __VLS_229({
    label: "Easy",
    value: "Easy",
}, ...__VLS_functionalComponentArgsRest(__VLS_229));
const __VLS_232 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_233 = __VLS_asFunctionalComponent(__VLS_232, new __VLS_232({
    label: "Normal",
    value: "Normal",
}));
const __VLS_234 = __VLS_233({
    label: "Normal",
    value: "Normal",
}, ...__VLS_functionalComponentArgsRest(__VLS_233));
const __VLS_236 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_237 = __VLS_asFunctionalComponent(__VLS_236, new __VLS_236({
    label: "Hard",
    value: "Hard",
}));
const __VLS_238 = __VLS_237({
    label: "Hard",
    value: "Hard",
}, ...__VLS_functionalComponentArgsRest(__VLS_237));
var __VLS_227;
var __VLS_223;
var __VLS_219;
const __VLS_240 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_241 = __VLS_asFunctionalComponent(__VLS_240, new __VLS_240({
    span: (6),
}));
const __VLS_242 = __VLS_241({
    span: (6),
}, ...__VLS_functionalComponentArgsRest(__VLS_241));
__VLS_243.slots.default;
const __VLS_244 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_245 = __VLS_asFunctionalComponent(__VLS_244, new __VLS_244({
    label: "Status",
}));
const __VLS_246 = __VLS_245({
    label: "Status",
}, ...__VLS_functionalComponentArgsRest(__VLS_245));
__VLS_247.slots.default;
const __VLS_248 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_249 = __VLS_asFunctionalComponent(__VLS_248, new __VLS_248({
    modelValue: (__VLS_ctx.form.status),
}));
const __VLS_250 = __VLS_249({
    modelValue: (__VLS_ctx.form.status),
}, ...__VLS_functionalComponentArgsRest(__VLS_249));
__VLS_251.slots.default;
const __VLS_252 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_253 = __VLS_asFunctionalComponent(__VLS_252, new __VLS_252({
    label: "APPROVED",
    value: "APPROVED",
}));
const __VLS_254 = __VLS_253({
    label: "APPROVED",
    value: "APPROVED",
}, ...__VLS_functionalComponentArgsRest(__VLS_253));
const __VLS_256 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_257 = __VLS_asFunctionalComponent(__VLS_256, new __VLS_256({
    label: "HIDDEN",
    value: "HIDDEN",
}));
const __VLS_258 = __VLS_257({
    label: "HIDDEN",
    value: "HIDDEN",
}, ...__VLS_functionalComponentArgsRest(__VLS_257));
var __VLS_251;
var __VLS_247;
var __VLS_243;
var __VLS_203;
const __VLS_260 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_261 = __VLS_asFunctionalComponent(__VLS_260, new __VLS_260({
    label: "Summary",
}));
const __VLS_262 = __VLS_261({
    label: "Summary",
}, ...__VLS_functionalComponentArgsRest(__VLS_261));
__VLS_263.slots.default;
const __VLS_264 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_265 = __VLS_asFunctionalComponent(__VLS_264, new __VLS_264({
    modelValue: (__VLS_ctx.form.summary),
}));
const __VLS_266 = __VLS_265({
    modelValue: (__VLS_ctx.form.summary),
}, ...__VLS_functionalComponentArgsRest(__VLS_265));
var __VLS_263;
const __VLS_268 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_269 = __VLS_asFunctionalComponent(__VLS_268, new __VLS_268({
    label: "Content",
}));
const __VLS_270 = __VLS_269({
    label: "Content",
}, ...__VLS_functionalComponentArgsRest(__VLS_269));
__VLS_271.slots.default;
const __VLS_272 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_273 = __VLS_asFunctionalComponent(__VLS_272, new __VLS_272({
    modelValue: (__VLS_ctx.form.content),
    type: "textarea",
    autosize: ({ minRows: 4 }),
}));
const __VLS_274 = __VLS_273({
    modelValue: (__VLS_ctx.form.content),
    type: "textarea",
    autosize: ({ minRows: 4 }),
}, ...__VLS_functionalComponentArgsRest(__VLS_273));
var __VLS_271;
const __VLS_276 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_277 = __VLS_asFunctionalComponent(__VLS_276, new __VLS_276({
    label: "Reference Answer",
}));
const __VLS_278 = __VLS_277({
    label: "Reference Answer",
}, ...__VLS_functionalComponentArgsRest(__VLS_277));
__VLS_279.slots.default;
const __VLS_280 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_281 = __VLS_asFunctionalComponent(__VLS_280, new __VLS_280({
    modelValue: (__VLS_ctx.form.answer),
    type: "textarea",
    autosize: ({ minRows: 3 }),
}));
const __VLS_282 = __VLS_281({
    modelValue: (__VLS_ctx.form.answer),
    type: "textarea",
    autosize: ({ minRows: 3 }),
}, ...__VLS_functionalComponentArgsRest(__VLS_281));
var __VLS_279;
var __VLS_199;
{
    const { footer: __VLS_thisSlot } = __VLS_195.slots;
    const __VLS_284 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_285 = __VLS_asFunctionalComponent(__VLS_284, new __VLS_284({
        ...{ 'onClick': {} },
    }));
    const __VLS_286 = __VLS_285({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_285));
    let __VLS_288;
    let __VLS_289;
    let __VLS_290;
    const __VLS_291 = {
        onClick: (...[$event]) => {
            __VLS_ctx.dialogVisible = false;
        }
    };
    __VLS_287.slots.default;
    var __VLS_287;
    const __VLS_292 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_293 = __VLS_asFunctionalComponent(__VLS_292, new __VLS_292({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_294 = __VLS_293({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_293));
    let __VLS_296;
    let __VLS_297;
    let __VLS_298;
    const __VLS_299 = {
        onClick: (__VLS_ctx.save)
    };
    __VLS_295.slots.default;
    var __VLS_295;
}
var __VLS_195;
/** @type {__VLS_StyleScopedClasses['row-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['row-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['review-hint']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            activeTab: activeTab,
            pendingItems: pendingItems,
            filter: filter,
            sourceFilter: sourceFilter,
            dialogVisible: dialogVisible,
            form: form,
            filteredAll: filteredAll,
            sourceTagType: sourceTagType,
            loadAll: loadAll,
            loadPending: loadPending,
            onTabChange: onTabChange,
            edit: edit,
            save: save,
            setStatus: setStatus,
            approve: approve,
            reject: reject,
            remove: remove,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
