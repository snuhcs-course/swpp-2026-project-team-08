package com.mca.myapplication.data

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** Local mock API backed by app-private preferences so prototype drafts survive process death. */
class OnboardingRepository(context: Context) {
    private val preferences = context.applicationContext.getSharedPreferences("onboarding", Context.MODE_PRIVATE)

    suspend fun saveDraft(value: OnboardingDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            check(preferences.edit().putString(DRAFT_KEY, encode(value)).commit())
        }
    }

    suspend fun loadDraft(): Result<OnboardingDraft?> = withContext(Dispatchers.IO) {
        runCatching { preferences.getString(DRAFT_KEY, null)?.let(::decode) }
    }

    suspend fun complete(value: OnboardingDraft): Result<Unit> = saveDraft(value.copy(completed = true))

    private fun encode(draft: OnboardingDraft): String = JSONObject().apply {
        put("step", draft.step)
        put("fields", JSONObject().apply { draft.fields.forEach { (key, value) -> put(key, value) } })
        put("choices", JSONObject().apply {
            draft.choices.forEach { (key, values) -> put(key.toString(), JSONArray(values.toList())) }
        })
        put("safeFoods", JSONArray(draft.safeFoods))
        put("completed", draft.completed)
    }.toString()

    private fun decode(json: String): OnboardingDraft {
        val root = JSONObject(json)
        val fieldsJson = root.optJSONObject("fields") ?: JSONObject()
        val fields = buildMap { fieldsJson.keys().forEach { key -> put(key, fieldsJson.optString(key)) } }
        val choicesJson = root.optJSONObject("choices") ?: JSONObject()
        val choices = buildMap {
            choicesJson.keys().forEach { key ->
                val values = choicesJson.optJSONArray(key) ?: JSONArray()
                put(key.toInt(), buildSet { for (index in 0 until values.length()) add(values.getString(index)) })
            }
        }
        val foodsJson = root.optJSONArray("safeFoods") ?: JSONArray()
        val foods = List(foodsJson.length()) { index -> foodsJson.getString(index) }
        return OnboardingDraft(root.optInt("step"), fields, choices, foods, root.optBoolean("completed"))
    }

    private companion object { const val DRAFT_KEY = "draft_v1" }
}

data class OnboardingDraft(
    val step: Int = 0,
    val fields: Map<String, String> = emptyMap(),
    val choices: Map<Int, Set<String>> = emptyMap(),
    val safeFoods: List<String> = emptyList(),
    val completed: Boolean = false,
)
