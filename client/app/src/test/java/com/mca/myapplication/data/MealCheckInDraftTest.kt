package com.mca.myapplication.data

import org.junit.Assert.assertEquals
import org.junit.Test

class MealCheckInDraftTest {
    @Test
    fun savingNewFoodAddsParentInput() {
        val added = MealFood(id = "new", name = "Apple", source = FoodSource.AI)

        val result = MealCheckInDraft().withParentReviewedFood(added)

        assertEquals(listOf("Apple"), result.foods.map { it.name })
        assertEquals(FoodSource.PARENT, result.foods.single().source)
    }

    @Test
    fun reviewingAiFoodUpdatesExistingItemAndProvenance() {
        val original = MealFood(id = "omelet", name = "Omelet", source = FoodSource.AI)
        val draft = MealCheckInDraft(foods = listOf(original))

        val result = draft.withParentReviewedFood(original.copy(name = "Rolled omelet", history = "Usually accepted"))

        assertEquals(1, result.foods.size)
        assertEquals("Rolled omelet", result.foods.single().name)
        assertEquals("Usually accepted", result.foods.single().history)
        assertEquals(FoodSource.PARENT, result.foods.single().source)
    }

    @Test
    fun confirmingMealMarksRemainingSuggestionsAsParentInput() {
        val ai = MealFood(id = "ai", name = "Carrot", source = FoodSource.AI)
        val parent = MealFood(id = "parent", name = "Apple", source = FoodSource.PARENT)
        val draft = MealCheckInDraft(foods = listOf(ai, parent))

        val confirmed = draft.confirmedByParent()

        assertEquals(listOf(FoodSource.PARENT, FoodSource.PARENT), confirmed.foods.map { it.source })
        assertEquals(FoodSource.AI, draft.foods.first().source)
    }
}
