package com.group1.career.controller;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ResumeGenControllerTest {

    @Test
    void extractsTailorChangeItemsFromGeneratedHtml() {
        ResumeGenController controller = new ResumeGenController(null, null, null, null);

        List<String> items = controller.extractTailorChangeItems("""
                <h1>张三</h1>
                <h2>项目经历</h2>
                <ul><li>负责后端接口开发</li></ul>
                <h2>本次定制说明</h2>
                <ul>
                  <li>把 Java 项目经历前置，匹配后端岗位要求。</li>
                  <li>补强 Spring Boot、MySQL 等岗位关键词。</li>
                  <li>重写项目 bullet，突出接口设计和性能优化证据。</li>
                </ul>
                """);

        assertEquals(3, items.size());
        assertEquals("把 Java 项目经历前置，匹配后端岗位要求。", items.get(0));
        assertEquals("补强 Spring Boot、MySQL 等岗位关键词。", items.get(1));
        assertEquals("重写项目 bullet，突出接口设计和性能优化证据。", items.get(2));
    }
}
