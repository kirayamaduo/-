import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { api } from '@/api';
const orgs = ref([]);
const orgId = ref(null);
const students = ref([]);
const load = async () => {
    if (!orgId.value)
        return;
    try {
        students.value = await api.orgStudents(orgId.value);
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed to load students');
    }
};
onMounted(async () => {
    try {
        orgs.value = await api.listOrgs();
        if (orgs.value.length) {
            orgId.value = orgs.value[0].orgId;
            load();
        }
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed to load orgs');
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
const __VLS_0 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row-controls" },
});
const __VLS_4 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.orgId),
    placeholder: "Organization",
    ...{ style: {} },
}));
const __VLS_6 = __VLS_5({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.orgId),
    placeholder: "Organization",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onChange: (__VLS_ctx.load)
};
__VLS_7.slots.default;
for (const [o] of __VLS_getVForSourceType((__VLS_ctx.orgs))) {
    const __VLS_12 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        key: (o.orgId),
        label: (o.name),
        value: (o.orgId),
    }));
    const __VLS_14 = __VLS_13({
        key: (o.orgId),
        label: (o.name),
        value: (o.orgId),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
}
var __VLS_7;
const __VLS_16 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onClick': {} },
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onClick: (__VLS_ctx.load)
};
__VLS_19.slots.default;
var __VLS_19;
var __VLS_3;
const __VLS_24 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ style: {} },
}));
const __VLS_26 = __VLS_25({
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
const __VLS_28 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    data: (__VLS_ctx.students),
    stripe: true,
}));
const __VLS_30 = __VLS_29({
    data: (__VLS_ctx.students),
    stripe: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
const __VLS_32 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    prop: "userId",
    label: "ID",
    width: "80",
}));
const __VLS_34 = __VLS_33({
    prop: "userId",
    label: "ID",
    width: "80",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const __VLS_36 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    prop: "nickname",
    label: "Nickname",
}));
const __VLS_38 = __VLS_37({
    prop: "nickname",
    label: "Nickname",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
const __VLS_40 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    prop: "school",
    label: "School",
}));
const __VLS_42 = __VLS_41({
    prop: "school",
    label: "School",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const __VLS_44 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    prop: "major",
    label: "Major",
}));
const __VLS_46 = __VLS_45({
    prop: "major",
    label: "Major",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
const __VLS_48 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    prop: "interviewCount",
    label: "Interviews",
    width: "120",
}));
const __VLS_50 = __VLS_49({
    prop: "interviewCount",
    label: "Interviews",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
const __VLS_52 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    prop: "lastInterviewScore",
    label: "Last score",
    width: "120",
}));
const __VLS_54 = __VLS_53({
    prop: "lastInterviewScore",
    label: "Last score",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
var __VLS_31;
var __VLS_27;
/** @type {__VLS_StyleScopedClasses['row-controls']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            orgs: orgs,
            orgId: orgId,
            students: students,
            load: load,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
