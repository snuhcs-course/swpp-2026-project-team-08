package com.mca.myapplication

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mca.myapplication.data.HomeOverview
import com.mca.myapplication.data.HomeSosItem
import com.mca.myapplication.data.SavedMeal
import com.mca.myapplication.ui.components.FigmaIcon
import com.mca.myapplication.ui.theme.*
import kotlinx.coroutines.delay
import java.util.Calendar
import java.util.Locale

@Composable
fun HomeRoute(
    viewModel: HomeViewModel,
    hasMealDraft: Boolean,
    onStartMeal: (Boolean) -> Unit,
    onReviewDraft: () -> Unit,
    onReviewMeal: (String?) -> Unit,
    onRecommendation: (String?) -> Unit,
    onProfile: () -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(viewModel) {
        viewModel.refresh()
        while (true) { delay(60_000); viewModel.updateClock() }
    }
    HomeScreen(
        state = state,
        hasMealDraft = hasMealDraft,
        onStartMeal = { if (hasMealDraft) viewModel.showDraftChoice() else onStartMeal(false) },
        onResumeMeal = { viewModel.dismissDraftChoice(); onStartMeal(true) },
        onNewMeal = { viewModel.dismissDraftChoice(); onStartMeal(false) },
        onDismissDraft = viewModel::dismissDraftChoice,
        onReviewDraft = onReviewDraft,
        onReviewMeal = onReviewMeal,
        onRecommendation = onRecommendation,
        onProfile = onProfile,
        onRetry = viewModel::refresh,
        onTab = viewModel::select,
    )
}

@Composable
private fun HomeScreen(
    state: HomeUiState,
    hasMealDraft: Boolean,
    onStartMeal: () -> Unit,
    onResumeMeal: () -> Unit,
    onNewMeal: () -> Unit,
    onDismissDraft: () -> Unit,
    onReviewDraft: () -> Unit,
    onReviewMeal: (String?) -> Unit,
    onRecommendation: (String?) -> Unit,
    onProfile: () -> Unit,
    onRetry: () -> Unit,
    onTab: (HomeTab) -> Unit,
) {
    val s = HomeTexts.current
    val statusHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    Column(Modifier.fillMaxSize().background(MealCanvas).statusBarsPadding().navigationBarsPadding()) {
        Spacer(Modifier.height((44.dp - statusHeight).coerceAtLeast(0.dp)))
        if (state.selectedTab == HomeTab.TODAY) {
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(start = 24.dp, end = 24.dp, top = 10.dp, bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
                HomeGreeting(state.overview.caregiverName, state.nowMillis, s)
                NextMealCard(s, onStartMeal)
                if (hasMealDraft) HomeDraftCard(s, onResumeMeal, onReviewDraft)
                if (state.loading) CircularProgressIndicator(Modifier.align(Alignment.CenterHorizontally))
                else if (state.error) HomeMessageCard(s.loadError, s.retry, onRetry)
                else {
                    SosProgressCard(state.overview.sosItems, s)
                    HomeRecommendationCard(state.overview, s, onRecommendation)
                    MealCalendarCard(state.nowMillis, state.overview.meals.map { it.details.date }.toSet(), s)
                }
            }
        } else {
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 24.dp, vertical = 18.dp)) {
                Text(s.tabs[state.selectedTab.ordinal], color = MealNavy, fontFamily = HomePoppins, fontWeight = FontWeight.SemiBold, fontSize = 24.sp)
                Spacer(Modifier.height(18.dp))
                if (state.loading) CircularProgressIndicator()
                else if (state.error) HomeMessageCard(s.loadError, s.retry, onRetry)
                else when (state.selectedTab) {
                    HomeTab.MEAL_LOG -> HomeMealList(state.overview.meals, s, onReviewMeal)
                    HomeTab.SOS -> HomeSosList(state.overview.sosItems, s)
                    HomeTab.INSIGHT -> HomeMessageCard(s.noInsights)
                    else -> Unit
                }
            }
        }
        HomeBottomNavigation(state.selectedTab, s) { tab ->
            when (tab) {
                HomeTab.IDEAS -> onRecommendation(null)
                HomeTab.PROFILE -> onProfile()
                else -> onTab(tab)
            }
        }
    }
    if (state.showDraftChoice && hasMealDraft) AlertDialog(
        onDismissRequest = onDismissDraft,
        title = { Text(s.draftTitle) },
        text = { Text(s.draftMessage) },
        confirmButton = { TextButton(onClick = onResumeMeal) { Text(s.resumeDraft) } },
        dismissButton = {
            Row {
                TextButton(onClick = onDismissDraft) { Text(s.cancel) }
                TextButton(onClick = onNewMeal) { Text(s.newMeal) }
            }
        },
    )
}

@Composable
private fun HomeGreeting(name: String, now: Long, s: HomeText) {
    Row(Modifier.fillMaxWidth().heightIn(min = 54.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(s.date(now), color = MealBlue, fontFamily = HomePoppins, fontWeight = FontWeight.Bold, fontSize = 10.sp, maxLines = 1)
            Text(s.greeting(now, name), color = MealNavy, fontFamily = HomePoppins, fontWeight = FontWeight.SemiBold, fontSize = 24.sp, maxLines = 2, lineHeight = 31.sp, modifier = Modifier.padding(top = 3.dp))
        }
        Box(Modifier.padding(start = 8.dp).size(44.dp).background(HomeCell, CircleShape), contentAlignment = Alignment.Center) {
            if (name.isBlank()) FigmaIcon(R.drawable.ic_home_user, size = 20.dp, tint = MealNavy)
            else Text(name.trim().first().uppercase(), color = MealNavy, fontFamily = HomePoppins, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun NextMealCard(s: HomeText, onStartMeal: () -> Unit) {
    Surface(modifier = Modifier.fillMaxWidth().heightIn(min = 194.dp), shape = RoundedCornerShape(22.dp), color = MealNavy, shadowElevation = 6.dp) {
        Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(22.dp))) {
            Box(Modifier.align(Alignment.TopEnd).offset(x = 16.dp, y = (-12).dp).size(104.dp).background(MealSoftBlue.copy(alpha = 0.16f), CircleShape))
            Column(Modifier.fillMaxWidth().padding(20.dp)) {
                Text(s.nextUp, color = MealSoftBlue, fontFamily = HomePoppins, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                Text(s.ready, color = Color.White, fontFamily = HomePoppins, fontWeight = FontWeight.SemiBold, fontSize = 17.sp, modifier = Modifier.padding(top = 5.dp))
                Text(s.photoHint, color = HomeCardCopy, fontFamily = HomePoppins, fontSize = 12.sp, lineHeight = 17.sp, modifier = Modifier.padding(top = 5.dp))
                Spacer(Modifier.height(15.dp))
                Surface(onClick = onStartMeal, color = MealBlue, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth().height(54.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                        FigmaIcon(R.drawable.ic_figma_camera, size = 18.dp, tint = Color.White)
                        Text(s.logMeal, color = Color.White, fontFamily = HomePoppins, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, modifier = Modifier.padding(start = 9.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeDraftCard(s: HomeText, onResumeMeal: () -> Unit, onReviewDraft: () -> Unit) {
    HomeWidget {
        Text(s.draftTitle, color = MealNavy, fontFamily = HomePoppins, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
        Text(s.reviewDraftHint, color = MealMuted, fontFamily = HomePoppins, fontSize = 11.sp, lineHeight = 16.sp)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onResumeMeal, modifier = Modifier.weight(1f).heightIn(min = 52.dp), border = BorderStroke(1.dp, MealBorder), colors = ButtonDefaults.outlinedButtonColors(contentColor = MealBlue)) {
                Text(s.resumeDraft, fontSize = 11.sp, fontFamily = HomePoppins)
            }
            Button(onClick = onReviewDraft, modifier = Modifier.weight(1f).heightIn(min = 52.dp), colors = ButtonDefaults.buttonColors(containerColor = MealBlue)) {
                Text(s.reviewDraft, fontSize = 11.sp, fontFamily = HomePoppins, maxLines = 2)
            }
        }
    }
}

@Composable
private fun HomeWidget(content: @Composable ColumnScope.() -> Unit) {
    Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), color = Color.White, shadowElevation = 3.dp) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp), content = content)
    }
}

@Composable
private fun WidgetHeader(title: String, subtitle: String, pill: String? = null) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(title, color = MealNavy, fontFamily = HomePoppins, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
            Text(subtitle, color = MealMuted, fontFamily = HomePoppins, fontWeight = FontWeight.SemiBold, fontSize = 10.sp, lineHeight = 14.sp, modifier = Modifier.padding(top = 2.dp))
        }
        if (pill != null) Surface(color = MealSoftBlue, shape = CircleShape) {
            Text(pill, color = MealBlue, fontFamily = HomePoppins, fontWeight = FontWeight.Bold, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp))
        }
    }
}

@Composable
private fun SosProgressCard(items: List<HomeSosItem>, s: HomeText) {
    HomeWidget {
        WidgetHeader(s.sosTitle, s.sosSubtitle, s.items(items.size))
        if (items.isEmpty()) Text(s.sosEmpty, color = MealMuted, fontFamily = HomePoppins, fontSize = 11.sp, lineHeight = 16.sp)
        else items.take(2).forEachIndexed { index, item ->
            if (index > 0) HorizontalDivider(color = HomeDivider, thickness = 1.dp)
            SosRow(item, s)
        }
    }
}

@Composable
private fun SosRow(item: HomeSosItem, s: HomeText) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(Modifier.size(40.dp).background(MealSoftBlue, RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) {
            val icon = when {
                item.foodName.equals("Carrot", ignoreCase = true) || item.foodName == "당근" -> R.drawable.ic_home_carrot
                item.stage == 1 -> R.drawable.ic_home_circle_x
                else -> R.drawable.ic_home_utensils
            }
            FigmaIcon(icon, size = 20.dp, tint = if (icon == R.drawable.ic_home_utensils) MealBlue else Color.Unspecified)
        }
        Column(Modifier.weight(1f)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(item.foodName, color = MealNavy, fontFamily = HomePoppins, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                Text(s.stage(item.stage), color = if (item.stage > 1) MealBlue else HomeInactive, fontFamily = HomePoppins, fontWeight = FontWeight.Bold, fontSize = 10.sp)
            }
            Text(s.stageDescription(item.stage), color = MealMuted, fontFamily = HomePoppins, fontSize = 10.sp, modifier = Modifier.padding(top = 4.dp))
        }
    }
}

@Composable
private fun HomeRecommendationCard(overview: HomeOverview, s: HomeText, onRecommendation: (String?) -> Unit) {
    val saved = overview.recommendation
    HomeWidget {
        WidgetHeader(s.recommendedTitle, s.recommendedSubtitle)
        if (saved == null) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(s.noRecommendation, color = MealMuted, fontFamily = HomePoppins, fontSize = 10.sp, modifier = Modifier.weight(1f))
                TextButton(onClick = { onRecommendation(null) }) { Text(s.seeIdeas, color = MealBlue, fontFamily = HomePoppins, fontSize = 10.sp) }
            }
        } else {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(Modifier.size(40.dp).background(MealSoftBlue, RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) {
                    val icon = if (saved.suggestion.foodName.equals("Carrot", ignoreCase = true) || saved.suggestion.foodName == "당근") R.drawable.ic_home_carrot else R.drawable.ic_home_utensils
                    FigmaIcon(icon, size = 20.dp, tint = if (icon == R.drawable.ic_home_utensils) MealBlue else Color.Unspecified)
                }
                Column(Modifier.weight(1f)) {
                    Text(RecommendationTexts.current.title(saved.suggestion), color = MealNavy, fontFamily = HomePoppins, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, maxLines = 2, lineHeight = 18.sp)
                    Text(RecommendationTexts.current.reason(saved.suggestion), color = MealMuted, fontFamily = HomePoppins, fontSize = 10.sp, maxLines = 2, lineHeight = 14.sp, modifier = Modifier.padding(top = 2.dp))
                }
                Surface(onClick = { onRecommendation(saved.mealId) }, color = HomeCell, shape = CircleShape) {
                    Text(s.tryAction, color = MealNavy, fontFamily = HomePoppins, fontWeight = FontWeight.Bold, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp))
                }
            }
        }
    }
}

@Composable
private fun MealCalendarCard(now: Long, loggedDates: Set<String>, s: HomeText) {
    val calendar = remember(now) { Calendar.getInstance().apply { timeInMillis = now; set(Calendar.DAY_OF_MONTH, 1) } }
    val year = calendar.get(Calendar.YEAR)
    val month = calendar.get(Calendar.MONTH)
    val offset = (calendar.get(Calendar.DAY_OF_WEEK) + 5) % 7
    val days = calendar.getActualMaximum(Calendar.DAY_OF_MONTH)
    val cells = List(offset) { 0 } + (1..days).toList()
    val weeks = cells.chunked(7).map { it + List(7 - it.size) { 0 } }
    HomeWidget {
        WidgetHeader(s.calendarTitle, s.calendarSubtitle, s.month(now))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            s.weekdays.forEach { weekday -> Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                Text(weekday, color = HomeInactive, fontFamily = HomePoppins, fontWeight = FontWeight.Bold, fontSize = 10.sp, maxLines = 1)
            } }
        }
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            weeks.forEach { week -> Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                week.forEach { day ->
                    val date = if (day == 0) "" else "%04d-%02d-%02d".format(Locale.US, year, month + 1, day)
                    val logged = date in loggedDates
                    Box(Modifier.weight(1f).aspectRatio(1f).background(if (day == 0) Color.Transparent else if (logged) MealBlue else HomeCell, RoundedCornerShape(12.dp))
                        .semantics { if (day > 0) contentDescription = "$day · ${if (logged) s.logged else s.unlogged}" }, contentAlignment = Alignment.Center) {
                        if (day > 0) Text(day.toString(), color = if (logged) Color.White else MealNavy, fontFamily = HomePoppins, fontWeight = if (logged) FontWeight.Bold else FontWeight.SemiBold, fontSize = 12.sp)
                    }
                }
            } }
        }
    }
}

@Composable
private fun HomeMealList(meals: List<SavedMeal>, s: HomeText, onReviewMeal: (String?) -> Unit) {
    if (meals.isEmpty()) HomeMessageCard(s.noMeals)
    else meals.forEach { meal ->
        Surface(onClick = { onReviewMeal(meal.id) }, shape = RoundedCornerShape(20.dp), color = Color.White, modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp)) {
            Column(Modifier.padding(16.dp)) {
                Text(meal.details.date, color = MealNavy, fontFamily = HomePoppins, fontWeight = FontWeight.SemiBold)
                Text(meal.details.foods.joinToString { it.name }, color = MealMuted, fontFamily = HomePoppins, fontSize = 11.sp, modifier = Modifier.padding(top = 5.dp))
                Text(s.mealReview, color = MealBlue, fontFamily = HomePoppins, fontSize = 10.sp, modifier = Modifier.padding(top = 7.dp))
            }
        }
    }
}

@Composable
private fun HomeSosList(items: List<HomeSosItem>, s: HomeText) {
    if (items.isEmpty()) HomeMessageCard(s.sosEmpty)
    else HomeWidget { items.forEachIndexed { index, item -> if (index > 0) HorizontalDivider(color = HomeDivider); SosRow(item, s) } }
}

@Composable
private fun HomeMessageCard(message: String, action: String? = null, onAction: (() -> Unit)? = null) {
    HomeWidget {
        Text(message, color = MealMuted, fontFamily = HomePoppins, fontSize = 12.sp)
        if (action != null && onAction != null) TextButton(onClick = onAction) { Text(action) }
    }
}

@Composable
private fun HomeBottomNavigation(selectedTab: HomeTab, s: HomeText, onTab: (HomeTab) -> Unit) {
    val icons = listOf(R.drawable.ic_home_home, R.drawable.ic_home_utensils, R.drawable.ic_home_alert,
        R.drawable.ic_home_sparkles, R.drawable.ic_home_chart, R.drawable.ic_home_user)
    Column {
        HorizontalDivider(color = HomeDivider, thickness = 1.dp)
        Row(Modifier.fillMaxWidth().height(71.dp).background(Color.White).padding(start = 12.dp, end = 12.dp, top = 9.dp, bottom = 11.dp)) {
            HomeTab.entries.forEachIndexed { index, tab ->
                val active = selectedTab == tab
                Column(Modifier.weight(1f).fillMaxHeight().clickable(role = Role.Tab) { onTab(tab) }.semantics { selected = active }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                    FigmaIcon(icons[index], size = 20.dp, tint = if (active) MealBlue else HomeInactive, description = s.tabs[index])
                    Text(s.tabs[index], color = if (active) MealBlue else HomeInactive, fontFamily = HomePoppins, fontWeight = if (active) FontWeight.SemiBold else FontWeight.Normal, fontSize = 8.sp, maxLines = 1, modifier = Modifier.padding(top = 4.dp))
                }
            }
        }
    }
}
