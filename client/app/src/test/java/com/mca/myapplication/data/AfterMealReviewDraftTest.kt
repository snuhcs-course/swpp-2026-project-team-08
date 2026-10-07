package com.mca.myapplication.data

import org.junit.Assert.*
import org.junit.Test

class AfterMealReviewDraftTest {
    private val food = MealFood(id = "dish", name = "Rice", ingredients = listOf("Rice", "Water"))

    @Test fun suggestionsDoNotAnswerRequiredItems() {
        val draft = AfterMealReviewDraft("meal", suggestions = food.outcomeKeys().associateWith { FoodOutcome.EATEN })
        assertEquals(food.outcomeKeys().toSet(), draft.missingAnswers(listOf(food)))
    }
    @Test fun foodAndIngredientAnswersAreIndependentAndUnclearCounts() {
        val draft = AfterMealReviewDraft("meal", answers = mapOf(foodOutcomeKey(food.id) to FoodOutcome.EATEN, ingredientOutcomeKey(food.id, "Rice") to FoodOutcome.UNTOUCHED))
        assertEquals(setOf(ingredientOutcomeKey(food.id, "Water")), draft.missingAnswers(listOf(food)))
        assertTrue(draft.copy(answers = draft.answers + (ingredientOutcomeKey(food.id, "Water") to FoodOutcome.UNCLEAR)).missingAnswers(listOf(food)).isEmpty())
    }
    @Test fun editsPreserveStableAnswersAndRemoveOrphans() {
        val draft = AfterMealReviewDraft("meal", answers = food.outcomeKeys().associateWith { FoodOutcome.TASTED }, suggestions = food.outcomeKeys().associateWith { FoodOutcome.EATEN }, difficulties = mapOf("removed" to listOf(DifficultyTag("Smell", "Strong"))))
        val edited = food.copy(name = "Steamed rice", ingredients = listOf("Rice", "Salt"))
        val reconciled = draft.reconcile(listOf(edited))
        assertEquals(FoodOutcome.TASTED, reconciled.answers[foodOutcomeKey(food.id)])
        assertEquals(FoodOutcome.TASTED, reconciled.answers[ingredientOutcomeKey(food.id, "Rice")])
        assertFalse(ingredientOutcomeKey(food.id, "Water") in reconciled.answers)
        assertFalse(ingredientOutcomeKey(food.id, "Water") in reconciled.suggestions)
        assertEquals(setOf(ingredientOutcomeKey(food.id, "Salt")), reconciled.missingAnswers(listOf(edited)))
        assertTrue(reconciled.difficulties.isEmpty())
    }
    @Test fun ingredientKeysDoNotCollideAcrossFoodsOrSeparators() {
        assertNotEquals(ingredientOutcomeKey("a", "b:c"), ingredientOutcomeKey("a:b", "c"))
        assertNotEquals(ingredientOutcomeKey("a", "Rice"), ingredientOutcomeKey("b", "Rice"))
    }
    @Test fun unfinishedOtherInputIsNotATag() {
        assertNull(DifficultyInput("Texture", "Other").toTag())
        assertNull(DifficultyInput("Color", "Others", " ").toTag())
        assertNull(DifficultyInput("Smell", "Other", "test").toTag())
        assertEquals(DifficultyTag("Texture", "Other", "grainy"), DifficultyInput("Texture", "Other", " grainy ").toTag())
    }
    @Test fun singleSelectionReplacesOnlyItsOwnCategory() {
        val existing = listOf(DifficultyTag("Texture", "Chewy / tough"), DifficultyTag("Smell", "Mild"))
        val updated = existing.adding(DifficultyTag("Smell", "Strong"))
        assertEquals(listOf(existing.first(), DifficultyTag("Smell", "Strong")), updated)
        assertEquals(updated, updated.adding(DifficultyTag("Smell", "Strong")))
    }
    @Test fun multipleValuesAndShapeNotesAreRetained() {
        val tags = emptyList<DifficultyTag>().adding(DifficultyTag("Color", "Red")).adding(DifficultyTag("Color", "Green"))
        assertEquals(2, tags.size)
        assertEquals(DifficultyTag("Shape and size", "Not sure", "Different sizes"), DifficultyInput("Shape and size", "Not sure", "Different sizes").toTag())
    }
}
