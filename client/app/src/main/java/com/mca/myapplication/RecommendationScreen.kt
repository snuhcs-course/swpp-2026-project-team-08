package com.mca.myapplication

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mca.myapplication.data.RecommendationAvailability
import com.mca.myapplication.data.SavedSuggestion
import com.mca.myapplication.ui.components.FigmaIcon
import com.mca.myapplication.ui.theme.*

@Composable
fun RecommendationRoute(viewModel: RecommendationViewModel, mealId: String?, onBack: () -> Unit, onProfileReview: () -> Unit, onMealReview: (String) -> Unit) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(mealId) { viewModel.open(mealId) }
    BackHandler(onBack = onBack)
    RecommendationScreen(state, onBack, onProfileReview, onMealReview, viewModel::retry, viewModel::decide)
}

@Composable
private fun RecommendationScreen(state: RecommendationUiState, onBack: () -> Unit, onProfileReview: () -> Unit, onMealReview: (String) -> Unit, onRetry: () -> Unit, onDecide: (Boolean) -> Unit) {
    val s = RecommendationTexts.current
    Column(Modifier.fillMaxSize().background(ReviewColors.Canvas).safeDrawingPadding()) {
        Row(Modifier.fillMaxWidth().padding(start = 18.dp, top = 8.dp, end = 18.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Surface(shape = CircleShape, color = Color.White, border = BorderStroke(1.dp, ReviewColors.Border)) {
                Box(Modifier.size(36.dp), contentAlignment = Alignment.Center) { FigmaIcon(R.drawable.ic_figma_back, description = s.back, size = 18.dp, tint = ReviewColors.Ink) }
            } }
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 24.dp)) {
            Text(s.title, color = ReviewColors.Ink, fontSize = 21.sp, fontWeight = FontWeight.Bold)
            Text(s.subtitle, color = ReviewColors.Muted, fontSize = 12.sp, modifier = Modifier.padding(top = 5.dp, bottom = 16.dp))
            if (state.error) Text(s.error, color = MealDestructiveInk, fontSize = 12.sp, modifier = Modifier.padding(bottom = 10.dp))
            when {
                state.loading -> Box(Modifier.fillMaxWidth().height(220.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                state.candidates.isNotEmpty() -> {
                    val card = state.candidates.first()
                    RecommendationCard(card, s, Modifier.pointerInput(card.id, state.saving) {
                        var drag = 0f
                        detectHorizontalDragGestures(onDragStart = { drag = 0f }, onHorizontalDrag = { change, amount -> change.consume(); drag += amount }, onDragEnd = {
                            if (!state.saving && kotlin.math.abs(drag) > 80.dp.toPx()) onDecide(drag > 0)
                        })
                    })
                    Row(Modifier.fillMaxWidth().padding(top = 24.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
                        FilledTonalIconButton(onClick = { onDecide(false) }, enabled = !state.saving, modifier = Modifier.size(56.dp)) {
                            FigmaIcon(R.drawable.ic_figma_close, description = s.skip, size = 22.dp, tint = MealAiInk)
                        }
                        FilledIconButton(onClick = { onDecide(true) }, enabled = !state.saving, modifier = Modifier.size(56.dp)) {
                            FigmaIcon(R.drawable.ic_figma_check, description = s.save, size = 22.dp, tint = Color.White)
                        }
                    }
                    if (state.saving) LinearProgressIndicator(Modifier.fillMaxWidth().padding(top = 16.dp))
                    Text(s.safetyNote, color = ReviewColors.Muted, fontSize = 11.sp, modifier = Modifier.padding(top = 20.dp))
                }
                state.error -> TextButton(onClick = onRetry) { Text(s.retry) }
                else -> {
                    val message = when (state.availability) {
                        RecommendationAvailability.NO_MEAL -> s.empty
                        RecommendationAvailability.INCOMPLETE_REVIEW -> s.incomplete
                        RecommendationAvailability.SAFETY -> s.safety
                        RecommendationAvailability.NO_EVIDENCE -> s.evidence
                        RecommendationAvailability.EXHAUSTED, RecommendationAvailability.READY -> s.exhausted
                    }
                    Surface(shape = RoundedCornerShape(20.dp), color = Color.White, border = BorderStroke(1.dp, ReviewColors.Border)) {
                        Text(message, color = ReviewColors.Ink, fontSize = 14.sp, lineHeight = 21.sp, modifier = Modifier.fillMaxWidth().padding(20.dp))
                    }
                    if (state.availability == RecommendationAvailability.SAFETY) {
                        Button(onClick = onProfileReview, modifier = Modifier.fillMaxWidth().padding(top = 14.dp)) { Text(s.checkProfile) }
                        state.mealId?.let { id ->
                            OutlinedButton(onClick = { onMealReview(id) }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) { Text(s.checkMeal) }
                        }
                    }
                }
            }
            if (state.saved.isNotEmpty()) {
                Text(s.saved, color = ReviewColors.Ink, fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 24.dp, bottom = 10.dp))
                state.saved.forEach { card -> RecommendationCard(card, s, Modifier.padding(bottom = 10.dp), compact = true) }
            }
        }
    }
}

@Composable
private fun RecommendationCard(card: SavedSuggestion, s: RecommendationText, modifier: Modifier = Modifier, compact: Boolean = false) {
    Surface(shape = RoundedCornerShape(22.dp), color = Color.White, border = BorderStroke(1.dp, ReviewColors.Border), shadowElevation = if (compact) 0.dp else 4.dp, modifier = modifier.fillMaxWidth()) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(if (compact) 7.dp else 11.dp)) {
            Text(s.recommended, color = ReviewColors.Selected, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Text(s.what, color = ReviewColors.Selected, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Text(s.title(card), color = ReviewColors.Ink, fontSize = if (compact) 17.sp else 23.sp, lineHeight = if (compact) 22.sp else 28.sp, fontWeight = FontWeight.Bold)
            Text(s.why, color = ReviewColors.Selected, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Text(s.reason(card), color = ReviewColors.Muted, fontSize = 13.sp, lineHeight = 18.sp)
            Text(s.tip, color = ReviewColors.Selected, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Text(s.tip(card), color = ReviewColors.Muted, fontSize = 13.sp, lineHeight = 18.sp)
        }
    }
}
