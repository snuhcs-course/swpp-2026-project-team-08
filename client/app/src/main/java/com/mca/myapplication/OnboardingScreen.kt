package com.mca.myapplication

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.BorderStroke
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mca.myapplication.ui.components.FormFieldLabel
import com.mca.myapplication.ui.components.InfoBanner
import com.mca.myapplication.ui.components.NurtureTextField
import com.mca.myapplication.ui.components.OnboardingColors
import com.mca.myapplication.ui.components.OnboardingNavigationBar
import com.mca.myapplication.ui.components.OnboardingProgress
import com.mca.myapplication.ui.components.PrimaryActionButton
import com.mca.myapplication.ui.components.SelectionOption

private val Canvas get() = OnboardingColors.Canvas
private val Blue get() = OnboardingColors.Blue
private val Ink get() = OnboardingColors.Ink
private val Muted get() = OnboardingColors.Muted
private val Line get() = OnboardingColors.Line
private val SoftBlue get() = OnboardingColors.SoftBlue
private data class OnboardingPage(
    val number: Int,
    val title: String,
    val subtitle: String,
    val section: String,
    val description: String,
    val choices: List<String> = emptyList(),
    val multiSelect: Boolean = true,
    val exclusive: String? = null,
    val key: Int = number,
)

private val pages = listOf(
    OnboardingPage(1, "Create your caregiver account", "Welcome! Let’s take this one step at a time.", "Account", "", multiSelect = false),
    OnboardingPage(2, "Data and photo consent", "Consent is needed to continue.", "Consent to Collection and Use of Personal Information", "Please review the information below and agree to continue.", listOf("Account and care privacy", "Photo analysis and personalization", "AI training and model research")),
    OnboardingPage(4, "Tell us about your child", "A few basics help us give better recommendations and output.", "Child basics", "", multiSelect = false),
    OnboardingPage(5, "Food allergies", "Select every known allergy. Help avoid foods that should not be suggested to the child.", "Safety-critical", "Always check labels, preparation and cross-contact yourself. The app does not replace medical advice.", listOf("No known food allergies", "Peanuts", "Tree nuts", "Milk / Dairy", "Eggs", "Soy", "Wheat", "Fish", "Shellfish", "Sesame", "Other allergy"), exclusive = "No known food allergies"),
    OnboardingPage(6, "Other dietary restrictions", "Help us avoid foods that may not be safe or suitable for your child.", "Are there any other foods or ingredients Leo needs to avoid?", "Select all that apply. Add other restrictions below.", listOf("No additional dietary restrictions", "Gluten-free", "Lactose-free", "Low fructose", "Casein-free", "Other restrictions"), exclusive = "No additional dietary restrictions"),
    OnboardingPage(7, "Foods the family includes", "Select food groups your household is comfortable including. This is about your dietary preferences, not foods that aren’t currently liked or safe.", "Included food groups", "This helps us prioritize foods that fit your family routine.", listOf("Dairy", "Eggs", "Seafood", "Poultry", "Red meat", "Legumes / soy", "Nuts / seeds", "Other")),
    OnboardingPage(8, "Dietary approaches", "", "Which approaches fit your family?", "Choose any that apply, or select none.", listOf("No specific approach", "Vegetarian", "Vegan", "Pescatarian", "Halal", "Kosher", "Other"), exclusive = "No specific approach"),
    OnboardingPage(11, "Sensory Profile", "", "Which food textures are often difficult for Leo?", "", listOf("No clear texture difficulty", "Smooth / creamy", "Soft / mushy", "Lumpy / chunky", "Crunchy / crisp", "Chewy / tough", "Wet / slippery", "Mixed textures", "Other texture")),
    OnboardingPage(12, "Sensory Profile", "", "Are strong food smells often difficult for Leo?", "For example, strong smells from fish, cooked onions, or some cooked vegetables.", listOf("Yes", "Sometimes", "No", "Not sure"), multiSelect = false),
    OnboardingPage(12, "Sensory Profile", "", "Which tastes are often difficult for Leo?", "", listOf("No clear taste difficulty", "Bitter", "Sour", "Spicy / hot", "Very sweet", "Very salty", "Other taste"), key = 120),
    OnboardingPage(13, "Sensory Profile", "", "Are any of these presentation details important for Leo?", "Select the ones that often affect whether (and how) Leo accepts a food.", listOf("No presentation preferences", "Specific colors", "Consistent shapes and sizes", "Foods kept separate", "Ingredients clearly visible", "Other")),
    OnboardingPage(14, "Sensory Profile", "", "What serving temperatures work best?", "", listOf("No clear temperature preference", "Cool / chilled", "Room temperature", "Warm", "Hot"), multiSelect = false),
    OnboardingPage(15, "Familiarity with new foods", "When Leo sees a new food for the first time, what usually happens?", "First response", "This is only a general starting point. It does not assign a permanent exposure step.", listOf("Usually tastes a new food", "Okay on the plate, may not taste", "Prefers it nearby but separate", "Wants it removed", "Varies by food", "Not sure"), multiSelect = false),
    OnboardingPage(16, "Max’s Safe foods", "Add foods that (name) reliably accepts in a familiar form. We can use these foods as familiar starting points when suggesting something new.", "Safe foods", "Add a food and an optional preparation or serving note.", multiSelect = false),
    OnboardingPage(17, "Review Leo’s profile", "You’re in control. Edit any section now or later in Profile Settings.", "Profile summary", "", multiSelect = false),
)

@Composable
fun OnboardingApp(viewModel: OnboardingViewModel) {
    val savedState by viewModel.state.collectAsStateWithLifecycle()
    var pageIndex by rememberSaveable { mutableStateOf(0) }
    var fields by rememberSaveable { mutableStateOf(mapOf<String, String>()) }
    var selected by rememberSaveable { mutableStateOf(mapOf<Int, Set<String>>()) }
    var safeFoods by rememberSaveable { mutableStateOf(listOf<String>()) }
    var safeFoodDraft by rememberSaveable { mutableStateOf("") }
    var safePreparation by rememberSaveable { mutableStateOf("") }
    var safePresentation by rememberSaveable { mutableStateOf("") }
    var showSafeFoodCard by rememberSaveable { mutableStateOf(false) }
    var noSafeFoods by rememberSaveable { mutableStateOf(false) }
    var tutorialPage by rememberSaveable { mutableStateOf(-1) }
    var completed by rememberSaveable { mutableStateOf(false) }
    var restored by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(savedState.isLoaded) {
        if (savedState.isLoaded) {
            val draft = savedState.draft
            pageIndex = draft.step.coerceIn(0, pages.lastIndex)
            fields = draft.fields.filterKeys { it !in setOf("safeFoodDraft", "safePreparation", "safePresentation") }
            safeFoodDraft = draft.fields["safeFoodDraft"].orEmpty()
            safePreparation = draft.fields["safePreparation"].orEmpty()
            safePresentation = draft.fields["safePresentation"].orEmpty()
            selected = draft.choices.filterKeys { it != 16 }
            noSafeFoods = "No safe foods yet" in draft.choices[16].orEmpty()
            safeFoods = if (noSafeFoods) emptyList() else draft.safeFoods
            completed = draft.completed
            restored = true
        }
    }
    LaunchedEffect(restored, pageIndex, fields, selected, safeFoods, safeFoodDraft, safePreparation, safePresentation, noSafeFoods) {
        val savedFields = fields + mapOf("safeFoodDraft" to safeFoodDraft, "safePreparation" to safePreparation, "safePresentation" to safePresentation)
        val savedChoices = if (noSafeFoods) selected + (16 to setOf("No safe foods yet")) else selected - 16
        if (restored && savedState.isLoaded) viewModel.save(com.mca.myapplication.data.OnboardingDraft(pageIndex, savedFields, savedChoices, safeFoods))
    }
    LaunchedEffect(savedState.completed) { if (savedState.completed) completed = true }
    val page = pages[pageIndex.coerceIn(0, pages.lastIndex)]

    if (completed) {
        FullScreenMessage("You’re all set", "Leo’s profile is saved. You can update it any time in Profile Settings.", "Go to Home", onAction = { completed = false })
        return
    }
    if (tutorialPage >= 0) {
        val tutorialTitles = listOf("Log a meal", "Notice reactions", "Choose a next step")
        val descriptions = listOf("Capture what was served and the form it was offered in.", "Record what your child ate, explored, or avoided.", "Use the history to choose one small change for next time.")
        FullScreenMessage(
            title = "Example · ${tutorialTitles[tutorialPage]}",
            message = descriptions[tutorialPage],
            action = if (tutorialPage == 2) "Log first meal" else "Next",
            onAction = { if (tutorialPage == 2) { tutorialPage = -1; completed = true } else tutorialPage++ },
            onSkip = { tutorialPage = -1; completed = true },
            onBack = if (tutorialPage > 0) ({ tutorialPage-- }) else null,
            secondaryAction = if (tutorialPage == 2) "Go to Home" else null,
            onSecondaryAction = { tutorialPage = -1; completed = true },
        )
        return
    }

    val selectedOnPage = selected[page.key].orEmpty()
    Column(
        modifier = Modifier.fillMaxSize().background(Canvas).windowInsetsPadding(WindowInsets.statusBars)
    ) {
        Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
            OnboardingProgress(pageIndex + 1, pages.size, saved = !savedState.isSaving && !savedState.saveFailed)
            Spacer(Modifier.height(10.dp))
            Text(page.title, color = Ink, fontSize = 20.sp, lineHeight = 23.sp, fontWeight = FontWeight.Bold)
            if (page.subtitle.isNotBlank()) Text(page.subtitle, color = Muted, fontSize = 10.sp, lineHeight = 14.sp, modifier = Modifier.padding(top = 3.dp))
            Spacer(Modifier.height(12.dp))
            when (page.number) {
                1 -> AccountContent(fields) { key, value -> fields = fields + (key to value) }
                2 -> ConsentContent(selectedOnPage) { choice -> selected = selected + (2 to toggleSelection(selectedOnPage, choice, null, true)) }
                4 -> ChildContent(fields) { key, value -> fields = fields + (key to value) }
                16 -> SafeFoodsContent(
                    safeFoods, safeFoodDraft, safePreparation, safePresentation, showSafeFoodCard, noSafeFoods,
                    onOpen = { showSafeFoodCard = true; noSafeFoods = false },
                    onName = { safeFoodDraft = it }, onPreparation = { safePreparation = it }, onPresentation = { safePresentation = it },
                    onNoFoods = { noSafeFoods = it; if (it) safeFoods = emptyList() },
                    onAdd = { if (safeFoodDraft.isNotBlank() && safePreparation.isNotBlank()) {
                        safeFoods = safeFoods + listOf(safeFoodDraft.trim(), safePreparation.trim(), safePresentation.trim()).filter(String::isNotBlank).joinToString(" · ")
                        safeFoodDraft = ""; safePreparation = ""; safePresentation = ""; showSafeFoodCard = false; noSafeFoods = false
                    } }, onRemove = { safeFoods = safeFoods - it })
                17 -> ReviewContent(fields, selected, safeFoods, onEdit = { target -> pageIndex = target })
                else -> SelectionContent(page, selectedOnPage) { choice ->
                    selected = selected + (page.key to toggleSelection(selectedOnPage, choice, page.exclusive, page.multiSelect))
                }
            }
        }
        val canContinue = when (page.number) {
            1 -> fields["name"].orEmpty().isNotBlank() && fields["email"].orEmpty().contains("@") && fields["password"].orEmpty().length > 8
            2 -> "Account and care privacy" in selectedOnPage
            4 -> fields["nickname"].orEmpty().isNotBlank() && fields["age"].orEmpty().isNotBlank()
            5, 6 -> selectedOnPage.isNotEmpty()
            16 -> safeFoods.isNotEmpty() || noSafeFoods
            8 -> selectedOnPage.isNotEmpty()
            else -> true
        }
        OnboardingNavigationBar(
            primaryLabel = when (page.number) { 17 -> "Looks good"; 16 -> "Save & exit"; else -> "Continue" },
            onPrevious = { pageIndex = (pageIndex - 1).coerceAtLeast(0) },
            onContinue = {
                val draftFields = fields + mapOf("safeFoodDraft" to safeFoodDraft, "safePreparation" to safePreparation, "safePresentation" to safePresentation)
                val draftChoices = if (noSafeFoods) selected + (16 to setOf("No safe foods yet")) else selected - 16
                val currentDraft = com.mca.myapplication.data.OnboardingDraft(pageIndex, draftFields, draftChoices, safeFoods)
                if (page.number == 17) { viewModel.complete(currentDraft); return@OnboardingNavigationBar }
                if (page.number == 16) { viewModel.save(currentDraft); completed = true; return@OnboardingNavigationBar }
                else pageIndex = (pageIndex + 1).coerceAtMost(pages.lastIndex)
            }, enabled = canContinue
        )
    }
}

private fun toggleSelection(current: Set<String>, value: String, exclusive: String?, multi: Boolean): Set<String> {
    if (!multi) return if (value in current) emptySet() else setOf(value)
    if (value == exclusive) return if (value in current) emptySet() else setOf(value)
    return if (value in current) current - value else (current - (exclusive ?: "")) + value
}

@Composable
private fun AccountContent(values: Map<String, String>, onChange: (String, String) -> Unit) {
    FormFieldLabel("PARENT OR CAREGIVER FULL NAME")
    NurtureTextField("Name", values["name"].orEmpty()) { onChange("name", it) }
    FormFieldLabel("EMAIL", modifier = Modifier.padding(top = 10.dp))
    NurtureTextField("Email", values["email"].orEmpty()) { onChange("email", it) }
    FormFieldLabel("PASSWORD", modifier = Modifier.padding(top = 10.dp))
    NurtureTextField("Password", values["password"].orEmpty(), visualTransformation = PasswordVisualTransformation()) { onChange("password", it) }
}

@Composable
private fun ChildContent(values: Map<String, String>, onChange: (String, String) -> Unit) {
    FormFieldLabel("NICKNAME")
    NurtureTextField("Child’s nickname", values["nickname"].orEmpty()) { onChange("nickname", it) }
    Text("Use any name your family is comfortable with.", color = Muted, fontSize = 9.sp, modifier = Modifier.padding(top = 4.dp))
    FormFieldLabel("AGE RANGE", modifier = Modifier.padding(top = 12.dp))
    SelectionContent(OnboardingPage(4, "", "", "", "", listOf("Under 2 years", "2–3 years", "4–5 years", "6–8 years", "9–12 years", "13+ years"), false), setOfNotNull(values["age"]), { onChange("age", it) })
    InfoBanner("We ask for an age range, not an exact birth date, to reduce unnecessary personal data.", Modifier.padding(top = 8.dp))
}

@Composable
private fun ConsentContent(selected: Set<String>, onToggle: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("Consent to Collection and Use of Personal Information", color = Ink, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        Text("Required checks must be completed before continuing.", color = Muted, fontSize = 9.sp)
        listOf("Account and care privacy", "Photo analysis and personalization", "AI training and model research").forEachIndexed { index, label ->
            Surface(shape = RoundedCornerShape(9.dp), color = Color.White, border = BorderStroke(1.dp, Line), modifier = Modifier.fillMaxWidth().clickable { onToggle(label) }) {
                Row(Modifier.padding(horizontal = 10.dp, vertical = 8.dp), verticalAlignment = Alignment.Top) {
                    Checkbox(checked = label in selected, onCheckedChange = { onToggle(label) }, modifier = Modifier.size(20.dp), colors = CheckboxDefaults.colors(checkedColor = Blue))
                    Column(Modifier.padding(start = 8.dp).weight(1f)) {
                        Text(label, color = Ink, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                        Text(if (index == 0) "Required · account and care information" else if (index == 1) "Optional · only when you choose a photo feature" else "Optional · help improve future models", color = Muted, fontSize = 9.sp, lineHeight = 12.sp, modifier = Modifier.padding(top = 4.dp))
                    }
                    Text(if (index < 2) "REQUIRED" else "OPTIONAL", color = Blue, fontSize = 7.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
    Spacer(Modifier.height(10.dp))
    InfoBanner("Safety and recommendation limits\nThe app does not diagnose conditions or replace medical advice. Always check labels and allergen declarations.", Modifier.padding(top = 8.dp))
}

@Composable
private fun SelectionContent(page: OnboardingPage, selected: Set<String>, onToggle: (String) -> Unit) {
    if (page.section.isNotBlank()) Text(page.section, color = Ink, fontSize = 11.sp, lineHeight = 14.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 6.dp))
    if (page.description.isNotBlank()) Text(page.description, color = Muted, fontSize = 9.sp, lineHeight = 12.sp, modifier = Modifier.padding(bottom = 7.dp))
    val visibleChoices = page.choices + (selected - page.choices.toSet())
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        visibleChoices.forEach { choice ->
            val isSelected = choice in selected
            SelectionOption(choice, isSelected, onClick = { onToggle(choice) })
        }
    }
    if (page.number in listOf(5, 6)) {
        FormFieldLabel("OTHER", modifier = Modifier.padding(top = 11.dp))
        var custom by rememberSaveable(page.number) { mutableStateOf("") }
        Row(verticalAlignment = Alignment.CenterVertically) {
            NurtureTextField("Type a food or category", custom, Modifier.weight(1f)) { custom = it }
            Spacer(Modifier.width(6.dp))
            PrimaryActionButton("+ Add", { if (custom.isNotBlank()) { onToggle(custom.trim()); custom = "" } }, height = 46.dp, enabled = custom.isNotBlank())
        }
        Text("Add one item at a time.", color = Muted, fontSize = 8.sp, modifier = Modifier.padding(top = 3.dp))
    }
    if (page.number == 5 || page.number == 6) InfoBanner(if (page.number == 5) "Safety-critical\nCheck ingredient labels and cross-contact. Recommendations pause when allergy details are unknown." else "We use these safety details when checking future food suggestions.", Modifier.padding(top = 8.dp))
    if (page.number in 11..14 || page.number == 15) Text("${if (page.multiSelect) "Multiple selections allowed" else "Single selection"}", color = Muted, fontSize = 8.sp, modifier = Modifier.fillMaxWidth().padding(top = 4.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
}

@Composable
private fun SafeFoodsContent(items: List<String>, draft: String, preparation: String, presentation: String, showCard: Boolean, noFoods: Boolean, onOpen: () -> Unit, onName: (String) -> Unit, onPreparation: (String) -> Unit, onPresentation: (String) -> Unit, onNoFoods: (Boolean) -> Unit, onAdd: () -> Unit, onRemove: (String) -> Unit) {
    Text("SAFE FOODS", color = Ink, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    Text("Foods your child reliably accepts in a familiar form.", color = Muted, fontSize = 9.sp, modifier = Modifier.padding(top = 3.dp, bottom = 9.dp))
    Row(verticalAlignment = Alignment.CenterVertically) {
        NurtureTextField("Add a familiar food", draft, Modifier.weight(1f), onValueChange = onName)
        Spacer(Modifier.width(6.dp))
        PrimaryActionButton("+", onOpen, Modifier.size(width = 40.dp, height = 46.dp))
    }
    Spacer(Modifier.height(7.dp))
    if (showCard) {
        Surface(shape = RoundedCornerShape(10.dp), color = Color.White, border = BorderStroke(1.dp, Line), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
            Column(Modifier.padding(10.dp)) {
                Text("Add safe food", color = Ink, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                FormFieldLabel("FOOD NAME", Modifier.padding(top = 6.dp))
                NurtureTextField("Food name", draft, onValueChange = onName)
                FormFieldLabel("PREPARATION", Modifier.padding(top = 6.dp))
                NurtureTextField("Preparation", preparation, onValueChange = onPreparation)
                FormFieldLabel("PRESENTATION NOTE · OPTIONAL", Modifier.padding(top = 6.dp))
                NurtureTextField("Optional serving note", presentation, onValueChange = onPresentation)
                PrimaryActionButton("Add", onAdd, Modifier.fillMaxWidth().padding(top = 6.dp), enabled = draft.isNotBlank() && preparation.isNotBlank())
            }
        }
    }
    if (items.isEmpty()) SelectionOption("No safe foods yet", noFoods, onClick = { onNoFoods(!noFoods) })
    items.forEach { item ->
        Surface(shape = RoundedCornerShape(8.dp), color = Color.White, border = BorderStroke(1.dp, Line), modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp)) {
            Row(Modifier.padding(horizontal = 10.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(item, color = Ink, fontSize = 10.sp, modifier = Modifier.weight(1f))
                Text("Remove", color = Blue, fontSize = 9.sp, modifier = Modifier.clickable { onRemove(item) })
            }
        }
    }
}

@Composable
private fun ReviewContent(values: Map<String, String>, selected: Map<Int, Set<String>>, foods: List<String>, onEdit: (Int) -> Unit) {
    val summaries = listOf(
        "Safety restrictions" to "Allergies: ${selected[5]?.joinToString().orEmpty().ifBlank { "Not specified" }}",
        "Family practices" to (selected[7]?.joinToString().orEmpty().ifBlank { "Not specified" }),
        "Sensory tendencies" to ((selected[11].orEmpty() + selected[12].orEmpty() + selected[120].orEmpty() + selected[13].orEmpty() + selected[14].orEmpty()).joinToString().ifBlank { "Not specified" }),
        "Safe foods" to foods.joinToString().ifBlank { "None added" },
        "Child basics" to "${values["nickname"].orEmpty()} · ${values["age"].orEmpty()}".trim(' ', '·'),
        "Other dietary restrictions" to selected[6].orEmpty().joinToString().ifBlank { "Not specified" },
        "Presentation" to selected[13].orEmpty().joinToString().ifBlank { "Not specified" },
        "Serving temperature" to selected[14].orEmpty().joinToString().ifBlank { "Not specified" },
        "Taste intensity" to selected[120].orEmpty().joinToString().ifBlank { "Not specified" },
        "Food smell" to selected[12].orEmpty().joinToString().ifBlank { "Not specified" },
        "New-food familiarity" to selected[15].orEmpty().joinToString().ifBlank { "Not specified" },
    )
    val targetSteps = listOf(3, 5, 6, 12, 2, 4, 9, 10, 8, 7, 11)
    summaries.forEachIndexed { index, (title, summary) ->
        Surface(shape = RoundedCornerShape(8.dp), color = Color.White, border = BorderStroke(1.dp, Line), modifier = Modifier.fillMaxWidth().padding(bottom = 5.dp).clickable { onEdit(targetSteps[index]) }) {
            Row(Modifier.padding(horizontal = 9.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(title, color = Ink, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    Text(summary, color = Muted, fontSize = 8.sp, maxLines = 1)
                }
                Text("↗", color = Muted, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun FullScreenMessage(
    title: String,
    message: String,
    action: String,
    onAction: () -> Unit,
    onSkip: (() -> Unit)? = null,
    onBack: (() -> Unit)? = null,
    secondaryAction: String? = null,
    onSecondaryAction: () -> Unit = {},
) {
    Column(Modifier.fillMaxSize().background(Canvas).windowInsetsPadding(WindowInsets.statusBars).padding(horizontal = 30.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        if (onBack != null) Text("‹  Back", color = Blue, fontSize = 11.sp, modifier = Modifier.align(Alignment.Start).clickable { onBack() }.padding(bottom = 18.dp))
        Text(title, color = Ink, fontSize = 24.sp, lineHeight = 28.sp, fontWeight = FontWeight.Bold, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        Text(message, color = Muted, fontSize = 11.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center, modifier = Modifier.padding(top = 12.dp, bottom = 18.dp))
        PrimaryActionButton(action, onAction, Modifier.fillMaxWidth())
        if (secondaryAction != null) Text(secondaryAction, color = Blue, fontSize = 10.sp, modifier = Modifier.padding(top = 12.dp).clickable { onSecondaryAction() })
        if (onSkip != null) Text("Skip tutorial", color = Blue, fontSize = 10.sp, modifier = Modifier.padding(top = 12.dp).clickable { onSkip() })
    }
}
