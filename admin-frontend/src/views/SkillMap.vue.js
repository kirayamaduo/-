import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { api } from '@/api';
const paths = ref([]);
const activePath = ref(null);
const nodes = ref([]);
const pathDialogVisible = ref(false);
const pathForm = reactive({ code: '', name: '', description: '' });
const nodeDialogVisible = ref(false);
const nodeForm = reactive({ pathId: 0, name: '', description: '', level: 1, sortOrder: 0, estimatedHours: 10, parentId: 0 });
const loadPaths = async () => {
    try {
        paths.value = await api.listPaths();
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed');
    }
};
const onPathClick = async (row) => {
    activePath.value = row;
    if (!row.pathId)
        return;
    try {
        nodes.value = await api.listNodes(row.pathId);
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed');
    }
};
const newPath = () => {
    Object.assign(pathForm, { pathId: undefined, code: '', name: '', description: '' });
    pathDialogVisible.value = true;
};
const editPath = (row) => {
    Object.assign(pathForm, row);
    pathDialogVisible.value = true;
};
const savePath = async () => {
    try {
        await api.savePath({ ...pathForm });
        pathDialogVisible.value = false;
        ElMessage.success('Saved');
        loadPaths();
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed');
    }
};
const removePath = async (row) => {
    if (!row.pathId)
        return;
    try {
        await ElMessageBox.confirm('Delete this path?', 'Confirm', { type: 'warning' });
        await api.deletePath(row.pathId);
        ElMessage.success('Deleted');
        loadPaths();
    }
    catch { }
};
const newNode = () => {
    if (!activePath.value?.pathId)
        return;
    Object.assign(nodeForm, { nodeId: undefined, pathId: activePath.value.pathId, name: '', description: '', level: 1, sortOrder: 0, estimatedHours: 10, parentId: 0 });
    nodeDialogVisible.value = true;
};
const editNode = (row) => {
    Object.assign(nodeForm, row);
    nodeDialogVisible.value = true;
};
const saveNode = async () => {
    if (!activePath.value?.pathId)
        return;
    try {
        await api.saveNode(activePath.value.pathId, { ...nodeForm });
        nodeDialogVisible.value = false;
        ElMessage.success('Saved');
        onPathClick(activePath.value);
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed');
    }
};
const removeNode = async (row) => {
    if (!row.nodeId)
        return;
    try {
        await ElMessageBox.confirm('Delete this node?', 'Confirm', { type: 'warning' });
        await api.deleteNode(row.nodeId);
        ElMessage.success('Deleted');
        if (activePath.value)
            onPathClick(activePath.value);
    }
    catch { }
};
onMounted(loadPaths);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
const __VLS_0 = {}.ElRow;
/** @type {[typeof __VLS_components.ElRow, typeof __VLS_components.elRow, typeof __VLS_components.ElRow, typeof __VLS_components.elRow, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    gutter: (16),
}));
const __VLS_2 = __VLS_1({
    gutter: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    span: (10),
}));
const __VLS_6 = __VLS_5({
    span: (10),
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    header: "Career paths",
}));
const __VLS_10 = __VLS_9({
    header: "Career paths",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    type: "primary",
    size: "small",
    ...{ style: {} },
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    type: "primary",
    size: "small",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClick: (__VLS_ctx.newPath)
};
__VLS_15.slots.default;
var __VLS_15;
const __VLS_20 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    ...{ 'onRowClick': {} },
    data: (__VLS_ctx.paths),
    highlightCurrentRow: true,
    rowKey: ((r) => r.pathId),
}));
const __VLS_22 = __VLS_21({
    ...{ 'onRowClick': {} },
    data: (__VLS_ctx.paths),
    highlightCurrentRow: true,
    rowKey: ((r) => r.pathId),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onRowClick: (__VLS_ctx.onPathClick)
};
__VLS_23.slots.default;
const __VLS_28 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    prop: "code",
    label: "Code",
    width: "140",
}));
const __VLS_30 = __VLS_29({
    prop: "code",
    label: "Code",
    width: "140",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
const __VLS_32 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    prop: "name",
    label: "Name",
}));
const __VLS_34 = __VLS_33({
    prop: "name",
    label: "Name",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const __VLS_36 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    label: "Actions",
    width: "160",
}));
const __VLS_38 = __VLS_37({
    label: "Actions",
    width: "160",
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
    }));
    const __VLS_42 = __VLS_41({
        ...{ 'onClick': {} },
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    let __VLS_44;
    let __VLS_45;
    let __VLS_46;
    const __VLS_47 = {
        onClick: (...[$event]) => {
            __VLS_ctx.editPath(row);
        }
    };
    __VLS_43.slots.default;
    var __VLS_43;
    const __VLS_48 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
    }));
    const __VLS_50 = __VLS_49({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    let __VLS_52;
    let __VLS_53;
    let __VLS_54;
    const __VLS_55 = {
        onClick: (...[$event]) => {
            __VLS_ctx.removePath(row);
        }
    };
    __VLS_51.slots.default;
    var __VLS_51;
}
var __VLS_39;
var __VLS_23;
var __VLS_11;
var __VLS_7;
const __VLS_56 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    span: (14),
}));
const __VLS_58 = __VLS_57({
    span: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
const __VLS_60 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({}));
const __VLS_62 = __VLS_61({}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_63.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.activePath?.name || '(select a path)');
    if (__VLS_ctx.activePath) {
        const __VLS_64 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
            ...{ 'onClick': {} },
            type: "primary",
            size: "small",
        }));
        const __VLS_66 = __VLS_65({
            ...{ 'onClick': {} },
            type: "primary",
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_65));
        let __VLS_68;
        let __VLS_69;
        let __VLS_70;
        const __VLS_71 = {
            onClick: (__VLS_ctx.newNode)
        };
        __VLS_67.slots.default;
        var __VLS_67;
    }
}
const __VLS_72 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    data: (__VLS_ctx.nodes),
}));
const __VLS_74 = __VLS_73({
    data: (__VLS_ctx.nodes),
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
const __VLS_76 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    prop: "nodeId",
    label: "ID",
    width: "80",
}));
const __VLS_78 = __VLS_77({
    prop: "nodeId",
    label: "ID",
    width: "80",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
const __VLS_80 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    prop: "name",
    label: "Name",
}));
const __VLS_82 = __VLS_81({
    prop: "name",
    label: "Name",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
const __VLS_84 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    prop: "level",
    label: "Level",
    width: "80",
}));
const __VLS_86 = __VLS_85({
    prop: "level",
    label: "Level",
    width: "80",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
const __VLS_88 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    prop: "sortOrder",
    label: "Order",
    width: "80",
}));
const __VLS_90 = __VLS_89({
    prop: "sortOrder",
    label: "Order",
    width: "80",
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
const __VLS_92 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    prop: "estimatedHours",
    label: "Hours",
    width: "80",
}));
const __VLS_94 = __VLS_93({
    prop: "estimatedHours",
    label: "Hours",
    width: "80",
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
const __VLS_96 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    label: "Actions",
    width: "160",
}));
const __VLS_98 = __VLS_97({
    label: "Actions",
    width: "160",
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
__VLS_99.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_99.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_100 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        ...{ 'onClick': {} },
        size: "small",
    }));
    const __VLS_102 = __VLS_101({
        ...{ 'onClick': {} },
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    let __VLS_104;
    let __VLS_105;
    let __VLS_106;
    const __VLS_107 = {
        onClick: (...[$event]) => {
            __VLS_ctx.editNode(row);
        }
    };
    __VLS_103.slots.default;
    var __VLS_103;
    const __VLS_108 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
    }));
    const __VLS_110 = __VLS_109({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    let __VLS_112;
    let __VLS_113;
    let __VLS_114;
    const __VLS_115 = {
        onClick: (...[$event]) => {
            __VLS_ctx.removeNode(row);
        }
    };
    __VLS_111.slots.default;
    var __VLS_111;
}
var __VLS_99;
var __VLS_75;
var __VLS_63;
var __VLS_59;
var __VLS_3;
const __VLS_116 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    modelValue: (__VLS_ctx.pathDialogVisible),
    title: (__VLS_ctx.pathForm.pathId ? 'Edit path' : 'New path'),
    width: "480px",
}));
const __VLS_118 = __VLS_117({
    modelValue: (__VLS_ctx.pathDialogVisible),
    title: (__VLS_ctx.pathForm.pathId ? 'Edit path' : 'New path'),
    width: "480px",
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
__VLS_119.slots.default;
const __VLS_120 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
    model: (__VLS_ctx.pathForm),
    labelPosition: "top",
}));
const __VLS_122 = __VLS_121({
    model: (__VLS_ctx.pathForm),
    labelPosition: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
__VLS_123.slots.default;
const __VLS_124 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
    label: "Code",
}));
const __VLS_126 = __VLS_125({
    label: "Code",
}, ...__VLS_functionalComponentArgsRest(__VLS_125));
__VLS_127.slots.default;
const __VLS_128 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
    modelValue: (__VLS_ctx.pathForm.code),
}));
const __VLS_130 = __VLS_129({
    modelValue: (__VLS_ctx.pathForm.code),
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
var __VLS_127;
const __VLS_132 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    label: "Name",
}));
const __VLS_134 = __VLS_133({
    label: "Name",
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
__VLS_135.slots.default;
const __VLS_136 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
    modelValue: (__VLS_ctx.pathForm.name),
}));
const __VLS_138 = __VLS_137({
    modelValue: (__VLS_ctx.pathForm.name),
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
var __VLS_135;
const __VLS_140 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
    label: "Description",
}));
const __VLS_142 = __VLS_141({
    label: "Description",
}, ...__VLS_functionalComponentArgsRest(__VLS_141));
__VLS_143.slots.default;
const __VLS_144 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
    modelValue: (__VLS_ctx.pathForm.description),
    type: "textarea",
}));
const __VLS_146 = __VLS_145({
    modelValue: (__VLS_ctx.pathForm.description),
    type: "textarea",
}, ...__VLS_functionalComponentArgsRest(__VLS_145));
var __VLS_143;
var __VLS_123;
{
    const { footer: __VLS_thisSlot } = __VLS_119.slots;
    const __VLS_148 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
        ...{ 'onClick': {} },
    }));
    const __VLS_150 = __VLS_149({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_149));
    let __VLS_152;
    let __VLS_153;
    let __VLS_154;
    const __VLS_155 = {
        onClick: (...[$event]) => {
            __VLS_ctx.pathDialogVisible = false;
        }
    };
    __VLS_151.slots.default;
    var __VLS_151;
    const __VLS_156 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_158 = __VLS_157({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_157));
    let __VLS_160;
    let __VLS_161;
    let __VLS_162;
    const __VLS_163 = {
        onClick: (__VLS_ctx.savePath)
    };
    __VLS_159.slots.default;
    var __VLS_159;
}
var __VLS_119;
const __VLS_164 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    modelValue: (__VLS_ctx.nodeDialogVisible),
    title: (__VLS_ctx.nodeForm.nodeId ? 'Edit node' : 'New node'),
    width: "520px",
}));
const __VLS_166 = __VLS_165({
    modelValue: (__VLS_ctx.nodeDialogVisible),
    title: (__VLS_ctx.nodeForm.nodeId ? 'Edit node' : 'New node'),
    width: "520px",
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
__VLS_167.slots.default;
const __VLS_168 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
    model: (__VLS_ctx.nodeForm),
    labelPosition: "top",
}));
const __VLS_170 = __VLS_169({
    model: (__VLS_ctx.nodeForm),
    labelPosition: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_169));
__VLS_171.slots.default;
const __VLS_172 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
    label: "Name",
}));
const __VLS_174 = __VLS_173({
    label: "Name",
}, ...__VLS_functionalComponentArgsRest(__VLS_173));
__VLS_175.slots.default;
const __VLS_176 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
    modelValue: (__VLS_ctx.nodeForm.name),
}));
const __VLS_178 = __VLS_177({
    modelValue: (__VLS_ctx.nodeForm.name),
}, ...__VLS_functionalComponentArgsRest(__VLS_177));
var __VLS_175;
const __VLS_180 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
    label: "Description",
}));
const __VLS_182 = __VLS_181({
    label: "Description",
}, ...__VLS_functionalComponentArgsRest(__VLS_181));
__VLS_183.slots.default;
const __VLS_184 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
    modelValue: (__VLS_ctx.nodeForm.description),
    type: "textarea",
}));
const __VLS_186 = __VLS_185({
    modelValue: (__VLS_ctx.nodeForm.description),
    type: "textarea",
}, ...__VLS_functionalComponentArgsRest(__VLS_185));
var __VLS_183;
const __VLS_188 = {}.ElRow;
/** @type {[typeof __VLS_components.ElRow, typeof __VLS_components.elRow, typeof __VLS_components.ElRow, typeof __VLS_components.elRow, ]} */ ;
// @ts-ignore
const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
    gutter: (12),
}));
const __VLS_190 = __VLS_189({
    gutter: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_189));
__VLS_191.slots.default;
const __VLS_192 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_193 = __VLS_asFunctionalComponent(__VLS_192, new __VLS_192({
    span: (8),
}));
const __VLS_194 = __VLS_193({
    span: (8),
}, ...__VLS_functionalComponentArgsRest(__VLS_193));
__VLS_195.slots.default;
const __VLS_196 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
    label: "Level",
}));
const __VLS_198 = __VLS_197({
    label: "Level",
}, ...__VLS_functionalComponentArgsRest(__VLS_197));
__VLS_199.slots.default;
const __VLS_200 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({
    modelValue: (__VLS_ctx.nodeForm.level),
    min: (1),
    max: (10),
}));
const __VLS_202 = __VLS_201({
    modelValue: (__VLS_ctx.nodeForm.level),
    min: (1),
    max: (10),
}, ...__VLS_functionalComponentArgsRest(__VLS_201));
var __VLS_199;
var __VLS_195;
const __VLS_204 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
    span: (8),
}));
const __VLS_206 = __VLS_205({
    span: (8),
}, ...__VLS_functionalComponentArgsRest(__VLS_205));
__VLS_207.slots.default;
const __VLS_208 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
    label: "Sort order",
}));
const __VLS_210 = __VLS_209({
    label: "Sort order",
}, ...__VLS_functionalComponentArgsRest(__VLS_209));
__VLS_211.slots.default;
const __VLS_212 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
    modelValue: (__VLS_ctx.nodeForm.sortOrder),
    min: (0),
    max: (999),
}));
const __VLS_214 = __VLS_213({
    modelValue: (__VLS_ctx.nodeForm.sortOrder),
    min: (0),
    max: (999),
}, ...__VLS_functionalComponentArgsRest(__VLS_213));
var __VLS_211;
var __VLS_207;
const __VLS_216 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_217 = __VLS_asFunctionalComponent(__VLS_216, new __VLS_216({
    span: (8),
}));
const __VLS_218 = __VLS_217({
    span: (8),
}, ...__VLS_functionalComponentArgsRest(__VLS_217));
__VLS_219.slots.default;
const __VLS_220 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({
    label: "Hours",
}));
const __VLS_222 = __VLS_221({
    label: "Hours",
}, ...__VLS_functionalComponentArgsRest(__VLS_221));
__VLS_223.slots.default;
const __VLS_224 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_225 = __VLS_asFunctionalComponent(__VLS_224, new __VLS_224({
    modelValue: (__VLS_ctx.nodeForm.estimatedHours),
    min: (1),
    max: (500),
}));
const __VLS_226 = __VLS_225({
    modelValue: (__VLS_ctx.nodeForm.estimatedHours),
    min: (1),
    max: (500),
}, ...__VLS_functionalComponentArgsRest(__VLS_225));
var __VLS_223;
var __VLS_219;
var __VLS_191;
const __VLS_228 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_229 = __VLS_asFunctionalComponent(__VLS_228, new __VLS_228({
    label: "Parent node id (0 = root)",
}));
const __VLS_230 = __VLS_229({
    label: "Parent node id (0 = root)",
}, ...__VLS_functionalComponentArgsRest(__VLS_229));
__VLS_231.slots.default;
const __VLS_232 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_233 = __VLS_asFunctionalComponent(__VLS_232, new __VLS_232({
    modelValue: (__VLS_ctx.nodeForm.parentId),
    min: (0),
}));
const __VLS_234 = __VLS_233({
    modelValue: (__VLS_ctx.nodeForm.parentId),
    min: (0),
}, ...__VLS_functionalComponentArgsRest(__VLS_233));
var __VLS_231;
var __VLS_171;
{
    const { footer: __VLS_thisSlot } = __VLS_167.slots;
    const __VLS_236 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_237 = __VLS_asFunctionalComponent(__VLS_236, new __VLS_236({
        ...{ 'onClick': {} },
    }));
    const __VLS_238 = __VLS_237({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_237));
    let __VLS_240;
    let __VLS_241;
    let __VLS_242;
    const __VLS_243 = {
        onClick: (...[$event]) => {
            __VLS_ctx.nodeDialogVisible = false;
        }
    };
    __VLS_239.slots.default;
    var __VLS_239;
    const __VLS_244 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_245 = __VLS_asFunctionalComponent(__VLS_244, new __VLS_244({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_246 = __VLS_245({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_245));
    let __VLS_248;
    let __VLS_249;
    let __VLS_250;
    const __VLS_251 = {
        onClick: (__VLS_ctx.saveNode)
    };
    __VLS_247.slots.default;
    var __VLS_247;
}
var __VLS_167;
/** @type {__VLS_StyleScopedClasses['card-head']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            paths: paths,
            activePath: activePath,
            nodes: nodes,
            pathDialogVisible: pathDialogVisible,
            pathForm: pathForm,
            nodeDialogVisible: nodeDialogVisible,
            nodeForm: nodeForm,
            onPathClick: onPathClick,
            newPath: newPath,
            editPath: editPath,
            savePath: savePath,
            removePath: removePath,
            newNode: newNode,
            editNode: editNode,
            saveNode: saveNode,
            removeNode: removeNode,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
