<script setup lang="ts">
// The API reference: every route of the panel's OpenAPI document, grouped by
// tag, each one folded until opened. The text is the document's own, in
// English, whatever the page's language.
import { data } from '../api.data'
</script>

<template>
  <div class="nx-api" dir="ltr">
    <section v-for="tag in data.tags" :key="tag.name">
      <h2 :id="`api-${tag.name}`" tabindex="-1">
        {{ tag.name }}
        <a class="header-anchor" :href="`#api-${tag.name}`" :aria-label="tag.name"></a>
      </h2>
      <div class="desc" v-html="tag.desc"></div>
      <details v-for="op in tag.ops" :id="op.id" :key="op.id" class="op">
        <summary>
          <span :class="['method', op.method.toLowerCase()]">{{ op.method }}</span>
          <code class="path">{{ op.path }}</code>
          <span class="summary">{{ op.summary }}</span>
        </summary>
        <div class="body">
          <div v-if="op.desc" class="desc" v-html="op.desc"></div>
          <table v-if="op.params.length">
            <thead><tr><th>Parameter</th><th>In</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>
              <tr v-for="p in op.params" :key="p.in + p.name">
                <td><code>{{ p.name }}</code><span v-if="p.required" class="req">required</span></td>
                <td>{{ p.in }}</td>
                <td><code>{{ p.type }}</code></td>
                <td v-html="p.desc"></td>
              </tr>
            </tbody>
          </table>
          <template v-if="op.body">
            <h4>Request body <a v-if="op.body.ref" :href="`#schema-${op.body.ref}`"><code>{{ op.body.ref }}</code></a></h4>
            <table v-if="op.body.fields.length">
              <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
              <tbody>
                <tr v-for="f in op.body.fields" :key="f.name">
                  <td><code>{{ f.name }}</code><span v-if="f.required" class="req">required</span></td>
                  <td><code>{{ f.type }}</code></td>
                  <td v-html="f.desc"></td>
                </tr>
              </tbody>
            </table>
          </template>
          <h4>Responses</h4>
          <ul class="responses">
            <li v-for="r in op.responses" :key="r.code">
              <code :class="['code', r.code[0] === '2' ? 'ok' : 'err']">{{ r.code }}</code>
              <a v-if="r.ref" :href="`#schema-${r.ref}`"><code>{{ r.ref }}</code></a>
              <span class="rdesc" v-html="r.desc"></span>
            </li>
          </ul>
        </div>
      </details>
    </section>
    <section>
      <h2 id="api-schemas" tabindex="-1">Schemas <a class="header-anchor" href="#api-schemas" aria-label="Schemas"></a></h2>
      <details v-for="s in data.schemas" :id="`schema-${s.name}`" :key="s.name" class="op schema">
        <summary><code class="path">{{ s.name }}</code></summary>
        <div class="body">
          <div v-if="s.desc" class="desc" v-html="s.desc"></div>
          <table v-if="s.fields.length">
            <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>
              <tr v-for="f in s.fields" :key="f.name">
                <td><code>{{ f.name }}</code><span v-if="f.required" class="req">required</span></td>
                <td><code>{{ f.type }}</code></td>
                <td v-html="f.desc"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>
  </div>
</template>
