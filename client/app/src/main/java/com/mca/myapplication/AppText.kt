package com.mca.myapplication

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalConfiguration

data class MealCheckInText(
    val home: String,
    val homeSetting: String,
    val start: String,
    val resume: String,
    val mealDetails: String,
    val mealDate: String,
    val mealType: String,
    val setting: String,
    val breakfast: String,
    val lunch: String,
    val dinner: String,
    val snack: String,
    val restaurant: String,
    val school: String,
    val others: String,
    val nextPhoto: String,
    val addPhoto: String,
    val wholePlate: String,
    val goodLight: String,
    val centeredPlate: String,
    val visibleFood: String,
    val takePhoto: String,
    val gallery: String,
    val files: String,
    val supportedImages: String,
    val checkPhoto: String,
    val tapFullPhoto: String,
    val replacePhoto: String,
    val removePhoto: String,
    val localPhotoNotice: String,
    val usePhoto: String,
    val addFoodItems: String,
    val photoConsent: String,
    val learnPhoto: String,
    val analyzePhoto: String,
    val manualEntry: String,
    val analyzing: String,
    val cancelAnalysis: String,
    val analysisFailed: String,
    val retry: String,
    val reviewFoodItems: String,
    val suggestedFoodCount: String,
    val foodItemCount: String,
    val parentReview: String,
    val aiSuggestion: String,
    val parentInput: String,
    val ingredients: String,
    val presentation: String,
    val servingNote: String,
    val foodTraits: String,
    val optional: String,
    val foodHistory: String,
    val historyUsually: String,
    val historySometimes: String,
    val historyNotSure: String,
    val selectFoodHistory: String,
    val goBack: String,
    val exposureGoal: String,
    val edit: String,
    val addFood: String,
    val foodName: String,
    val addIngredient: String,
    val saveFood: String,
    val cancel: String,
    val confirmFoods: String,
    val savedDraft: String,
    val saving: String,
    val saveError: String,
    val mealSaved: String,
    val savedMessage: String,
    val startAnother: String,
    val learnConsentTitle: String,
    val learnConsentBody: String,
    val close: String,
    val addExposureGoal: String,
    val noFoods: String,
    val photoError: String,
    val removeFood: String,
    val otherHistory: String,
    val settingOfMeal: String,
    val draftPrefix: String,
    val aiReviewHint: String,
    val editFoodIntro: String,
    val reviewPrefix: String,
    val traits: List<String>,
    val emptyValue: String,
    val exposureGoalStep: String,
    val today: String,
    val selectDate: String,
    val month: String,
    val day: String,
    val year: String,
    val confirmDate: String,
    val editAllTraits: String,
    val saveTraits: String,
    val traitSelectorSubtitle: String,
    val traitMultiSelect: String,
    val traitSingleSelect: String,
    val addActualColor: String,
    val addShapeNote: String,
    val addExposureGoalTitle: String,
    val chooseExposureFood: String,
    val selectMealExposureGoal: String,
    val skipExposureGoal: String,
    val exposureStageNotSet: String,
    val exposureTrackerTitle: String,
    val exposureTrackerDescription: String,
    val exposureLadderTitle: String,
    val exposureStepLabels: List<String>,
    val backToExposureGoal: String,
    val traitLabels: Map<String, String>,
) {
    fun foodHistoryLabel(value: String): String = when (value) {
        "Usually accepted", "대체로 잘 먹음" -> historyUsually
        "Sometimes accepted", "가끔 먹음" -> historySometimes
        "Not sure", "잘 모르겠어요" -> historyNotSure
        else -> value
    }
    fun traitLabel(value: String): String = traitLabels[value] ?: value
}

object MealCheckInTexts {
    val current: MealCheckInText
        @Composable get() = if (LocalConfiguration.current.locales[0].language == "ko") korean else english

    private val english = MealCheckInText(
        home = "Home", homeSetting = "Home", start = "Start Meal Check-in", resume = "Resume meal draft", mealDetails = "Meal details",
        mealDate = "Meal date", mealType = "Meal type", setting = "Setting", breakfast = "Breakfast", lunch = "Lunch", dinner = "Dinner", snack = "Snack",
        restaurant = "Restaurant", school = "School", others = "Others", nextPhoto = "Continue to photo", addPhoto = "Add a before-meal photo",
        wholePlate = "Requirement: one photo of the whole plate", goodLight = "Use a good light", centeredPlate = "Keep the plate centered", visibleFood = "Make sure the food is easy to see",
        takePhoto = "Take a photo", gallery = "Choose from gallery", files = "Choose from files", supportedImages = "Files accept supported images only",
        checkPhoto = "Check your photo", tapFullPhoto = "Tap to view full photo", replacePhoto = "Replace photo", removePhoto = "Remove photo",
        localPhotoNotice = "This photo stays on this device until you choose Analyze photo or explicitly save it.", usePhoto = "Use this photo", addFoodItems = "Add food items",
        photoConsent = "By tapping Analyze photo, you consent to sending this meal photo to our analysis provider for this meal. It will not be used to train AI without separate consent.",
        learnPhoto = "How photo data is used", analyzePhoto = "Analyze photo", manualEntry = "Enter food items manually", analyzing = "Analyzing photo…", cancelAnalysis = "Cancel analysis",
        analysisFailed = "We couldn't analyze this photo. Your meal draft and photo are still here.", retry = "Try again", reviewFoodItems = "Review food items",
        suggestedFoodCount = "suggested food items", foodItemCount = "food items", parentReview = "PARENT REVIEW", aiSuggestion = "AI suggestion", parentInput = "Parent input", ingredients = "Ingredients",
        presentation = "Presentation", servingNote = "Serving note", foodTraits = "Food traits", optional = "Optional", foodHistory = "Food history", historyUsually = "Usually accepted", historySometimes = "Sometimes accepted", historyNotSure = "Not sure", selectFoodHistory = "Select food history", goBack = "Go back", exposureGoal = "Exposure Goal",
        edit = "Edit", addFood = "Add food item", foodName = "Food name", addIngredient = "Add ingredient", saveFood = "Save food", cancel = "Cancel", confirmFoods = "Confirm food items",
        savedDraft = "Your draft is saved as you go.", saving = "Saving…", saveError = "Couldn't save yet. Your current entries are still on screen.", mealSaved = "Meal saved",
        savedMessage = "Your meal and confirmed food details have been saved.", startAnother = "Start another meal", learnConsentTitle = "How photo data is used",
        learnConsentBody = "The photo is sent to the analysis provider only when you choose Analyze photo for this meal. It is not used to train AI without separate consent.",
        close = "Close", addExposureGoal = "Add", noFoods = "Add at least one food item to continue.", photoError = "This image couldn't be opened. Choose another image.", removeFood = "Remove", otherHistory = "Add a food history note",
        settingOfMeal = "Setting of the meal", draftPrefix = "Draft", aiReviewHint = "AI suggestions are never confirmed until you review them.",
        editFoodIntro = "Confirm or adjust what was served before saving.", reviewPrefix = "Review", traits = listOf("Crunchy / crisp", "Sweet", "Mild", "No noticeable smell", "Yellow", "Consistent", "Clearly visible", "Warm"), emptyValue = "—", exposureGoalStep = "Step 1 · Look",
        today = "Today", selectDate = "Select date", month = "Month", day = "Day", year = "Year", confirmDate = "Confirm date",
        editAllTraits = "Edit all traits", saveTraits = "Save traits", traitSelectorSubtitle = "Select only what describes this serving", traitMultiSelect = "Multi-select", traitSingleSelect = "Single-select", addActualColor = "Add an actual color", addShapeNote = "Add a shape and size note",
        addExposureGoalTitle = "Add an exposure goal", chooseExposureFood = "Choose one food to focus on during this meal.", selectMealExposureGoal = "Select this meal as exposure goal", skipExposureGoal = "Skip exposure goal", exposureStageNotSet = "No step yet",
        exposureTrackerTitle = "Exposure Tracker", exposureTrackerDescription = "The Exposure Tracker records food-specific familiarity and small steps the caregiver chooses to practice.", exposureLadderTitle = "Six-step exposure ladder", exposureStepLabels = listOf("Look", "Interact", "Smell", "Touch", "Taste / Lick", "Swallow"), backToExposureGoal = "Back to exposure goal", traitLabels = emptyMap(),
    )

    private val korean = MealCheckInText(
        home = "홈", homeSetting = "집", start = "식사 기록 시작", resume = "식사 초안 이어쓰기", mealDetails = "식사 정보",
        mealDate = "식사 날짜", mealType = "식사 유형", setting = "식사 장소", breakfast = "아침", lunch = "점심", dinner = "저녁", snack = "간식",
        restaurant = "식당", school = "학교", others = "기타", nextPhoto = "사진 추가하기", addPhoto = "식사 사진 추가",
        wholePlate = "접시 전체가 담긴 사진 한 장을 선택해 주세요", goodLight = "밝은 곳에서 촬영해 주세요", centeredPlate = "접시가 화면 가운데 오도록 해 주세요", visibleFood = "음식이 잘 보이도록 촬영해 주세요",
        takePhoto = "사진 촬영", gallery = "갤러리에서 선택", files = "파일에서 선택", supportedImages = "지원되는 이미지 파일만 선택할 수 있어요",
        checkPhoto = "사진 확인", tapFullPhoto = "눌러서 사진 전체 보기", replacePhoto = "사진 교체", removePhoto = "사진 삭제",
        localPhotoNotice = "분석을 선택하거나 사진을 직접 저장하기 전까지 사진은 이 기기에 보관됩니다.", usePhoto = "이 사진 사용", addFoodItems = "음식 추가",
        photoConsent = "사진 분석을 누르면 이 식사의 사진이 분석 제공자에게 전송되는 것에 동의합니다. 별도 동의 없이 AI 학습에 사용하지 않습니다.",
        learnPhoto = "사진 정보 이용 안내", analyzePhoto = "사진 분석", manualEntry = "음식 직접 입력", analyzing = "사진 분석 중…", cancelAnalysis = "분석 취소",
        analysisFailed = "사진을 분석하지 못했어요. 식사 초안과 사진은 그대로 보관되어 있습니다.", retry = "다시 시도", reviewFoodItems = "음식 확인",
        suggestedFoodCount = "개 음식 제안", foodItemCount = "개 음식 항목", parentReview = "보호자 확인 필요", aiSuggestion = "AI 제안", parentInput = "보호자 입력", ingredients = "재료",
        presentation = "제공 형태", servingNote = "제공 메모", foodTraits = "음식 특성", optional = "선택", foodHistory = "음식 이력", historyUsually = "대체로 잘 먹음", historySometimes = "가끔 먹음", historyNotSure = "잘 모르겠어요", selectFoodHistory = "음식 이력 선택", goBack = "뒤로", exposureGoal = "음식 경험 목표",
        edit = "수정", addFood = "음식 추가", foodName = "음식 이름", addIngredient = "재료 추가", saveFood = "음식 저장", cancel = "취소", confirmFoods = "음식 확인 완료",
        savedDraft = "작성 중인 내용이 자동 저장됩니다.", saving = "저장 중…", saveError = "저장하지 못했어요. 입력 내용은 화면에 남아 있습니다.", mealSaved = "식사 기록 저장 완료",
        savedMessage = "식사와 확인한 음식 정보가 저장되었습니다.", startAnother = "새 식사 기록", learnConsentTitle = "사진 정보 이용 안내",
        learnConsentBody = "이 식사에서 사진 분석을 선택한 경우에만 분석 제공자에게 사진을 전송합니다. 별도 동의 없이 AI 학습에 사용하지 않습니다.",
        close = "닫기", addExposureGoal = "추가", noFoods = "계속하려면 음식 항목을 하나 이상 추가해 주세요.", photoError = "이미지를 열 수 없어요. 다른 이미지를 선택해 주세요.", removeFood = "삭제", otherHistory = "음식 이력 메모 입력",
        settingOfMeal = "식사 설정", draftPrefix = "초안", aiReviewHint = "AI가 제안한 음식은 보호자가 확인하기 전까지 확정되지 않습니다.",
        editFoodIntro = "저장하기 전에 제공된 음식을 확인하거나 수정해 주세요.", reviewPrefix = "검토", traits = listOf("바삭함", "달콤함", "담백함", "강한 냄새 없음", "노란색", "일정한 모양", "재료가 잘 보임", "따뜻함"), emptyValue = "—", exposureGoalStep = "1단계 · 바라보기",
        today = "오늘", selectDate = "날짜 선택", month = "월", day = "일", year = "연도", confirmDate = "날짜 확인",
        editAllTraits = "음식 특성 전체 수정", saveTraits = "특성 저장", traitSelectorSubtitle = "이번 식사에 해당하는 특성만 선택해 주세요", traitMultiSelect = "복수 선택", traitSingleSelect = "하나 선택", addActualColor = "실제 색 추가", addShapeNote = "모양·크기 메모 추가",
        addExposureGoalTitle = "음식 경험 목표 추가", chooseExposureFood = "이번 식사에서 집중할 음식 하나를 선택해 주세요.", selectMealExposureGoal = "이 식사를 음식 경험 목표로 선택", skipExposureGoal = "음식 경험 목표 건너뛰기", exposureStageNotSet = "단계 미설정",
        exposureTrackerTitle = "음식 경험 추적기", exposureTrackerDescription = "음식별 익숙함과 보호자가 선택한 작은 시도를 기록합니다.", exposureLadderTitle = "6단계 음식 경험", exposureStepLabels = listOf("보기", "상호작용", "냄새 맡기", "만지기", "맛보기 / 핥기", "삼키기"), backToExposureGoal = "음식 경험 목표로 돌아가기",
        traitLabels = mapOf(
            "Texture" to "식감", "Taste type" to "맛 종류", "Taste intensity" to "맛 강도", "Smell" to "냄새", "Color" to "색", "Shape and size" to "모양과 크기", "Ingredient visibility" to "재료 가시성", "Temperature" to "온도",
            "Smooth / creamy" to "매끄럽고 크리미함", "Soft / mushy" to "부드럽고 무름", "Lumpy / chunky" to "덩어리짐", "Crunchy / crisp" to "바삭함", "Chewy / tough" to "질김", "Wet / slippery" to "축축하고 미끄러움", "Mixed textures" to "섞인 식감", "Other" to "기타",
            "Sweet" to "단맛", "Salty" to "짠맛", "Sour" to "신맛", "Bitter" to "쓴맛", "Spicy / hot" to "매운맛", "Mild" to "약함", "Strong" to "강함", "No noticeable smell" to "두드러진 냄새 없음", "Not sure" to "잘 모르겠음",
            "Green" to "초록색", "Yellow" to "노란색", "Red" to "빨간색", "Brown" to "갈색", "White" to "흰색", "Consistent" to "일정함", "Varied" to "다양함", "Clearly visible" to "잘 보임", "Partly visible" to "부분적으로 보임", "Blended / not separately visible" to "섞여서 구분되지 않음",
            "Hot" to "뜨거움", "Warm" to "따뜻함", "Room temperature" to "상온", "Cool / chilled" to "차가움", "Soft" to "부드러움", "Cool" to "차가움", "Orange" to "주황색",
        ),
    )
}

data class OnboardingPage(
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

val onboardingPages = listOf(
    OnboardingPage(1, "Create your caregiver account", "Welcome! Let’s take this one step at a time.", "Account", "", multiSelect = false),
    OnboardingPage(2, "Data and photo consent", "Consent is needed to continue.", "Consent to Collection and Use of Personal Information", "Please review the information below and agree to continue.", listOf("Account and care privacy", "Photo analysis and personalization", "AI training and model research")),
    OnboardingPage(4, "Tell us about your child", "A few basics help us give better recommendations and output.", "Child basics", "", multiSelect = false),
    OnboardingPage(5, "Food allergies", "Select every known allergy. Help avoid foods that should not be suggested to {child}.", "Safety-critical", "Always check labels, preparation and cross-contact yourself. The app does not replace medical advice.", listOf("No known food allergies", "Peanuts", "Tree nuts", "Milk / Dairy", "Eggs", "Soy", "Wheat", "Fish", "Shellfish", "Sesame", "Other allergy"), exclusive = "No known food allergies"),
    OnboardingPage(6, "Other dietary restrictions", "Help us avoid foods that may not be safe or suitable for {child}.", "Are there any other foods or ingredients {child} needs to avoid?", "Select all that apply. Add other restrictions below.", listOf("No additional dietary restrictions", "Gluten-free", "Lactose-free", "Low fructose", "Casein-free", "Other restrictions"), exclusive = "No additional dietary restrictions"),
    OnboardingPage(7, "Foods the family includes", "Select food groups your household is comfortable including. This is about family preferences, not only foods {child} currently likes or dislikes.", "Included food groups", "This helps us prioritize foods that fit your family routine.", listOf("Dairy", "Eggs", "Seafood", "Poultry", "Red meat", "Legumes / soy", "Nuts / seeds", "Other")),
    OnboardingPage(8, "Dietary approaches", "", "Which approaches fit your family?", "Choose any that apply, or select none.", listOf("No specific approach", "Gluten-free and casein-free", "No added sugar / limited artificial additives", "Low-fructose", "Low sodium", "Ketogenic", "Other"), exclusive = "No specific approach"),
    OnboardingPage(11, "Sensory Profile", "", "Which food textures are often difficult for {child}?", "", listOf("No clear texture difficulty", "Smooth / creamy", "Soft / mushy", "Lumpy / chunky", "Crunchy / crisp", "Chewy / tough", "Wet / slippery", "Mixed textures", "Other texture"), exclusive = "No clear texture difficulty"),
    OnboardingPage(12, "Sensory Profile", "", "Are strong food smells often difficult for {child}?", "For example, strong smells from fish, cooked onions, or some cooked vegetables.", listOf("Yes", "Sometimes", "No", "Not sure"), multiSelect = false),
    OnboardingPage(12, "Sensory Profile", "", "Which tastes are often difficult for {child}?", "", listOf("No clear taste difficulty", "Bitter", "Sour", "Spicy / hot", "Very sweet", "Very salty", "Other taste"), exclusive = "No clear taste difficulty", key = 120),
    OnboardingPage(13, "Sensory Profile", "", "Are any of these presentation details important for {child}?", "Select the ones that often affect whether (and how) {child} accepts a food.", listOf("No presentation preferences", "Specific colors", "Consistent shapes and sizes", "Foods kept separate", "Ingredients clearly visible", "Other"), exclusive = "No presentation preferences"),
    OnboardingPage(14, "Sensory Profile", "", "What serving temperatures work best?", "", listOf("No clear preference", "Warm", "Cool / chilled", "Room temperature", "It depends on the food"), multiSelect = false),
    OnboardingPage(15, "Familiarity with new foods", "When {child} sees a new food for the first time, what usually happens?", "First response", "This is only a general starting point. It does not assign a permanent exposure step.", listOf("Usually tastes a new food", "Okay on the plate, may not taste", "Prefers it nearby but separate", "Wants it removed", "Varies by food", "Not sure"), multiSelect = false),
    OnboardingPage(16, "{child}’s Safe foods", "Add foods that {child} reliably accepts in a familiar form. We can use these foods as familiar starting points when suggesting something new.", "Safe foods", "Add a food and an optional preparation or serving note.", multiSelect = false),
    OnboardingPage(17, "Review {child}’s profile", "You’re in control. Edit any section now or later in Profile Settings.", "Profile summary", "", multiSelect = false),
)

object OnboardingStrings {
    @Composable
    fun display(key: String, childName: String = ""): String {
        return translate(key, LocalConfiguration.current.locales[0].language == "ko", childName)
    }

    fun translate(key: String, korean: Boolean, childName: String = ""): String {
        val name = childName.trim().ifBlank { if (korean) "아이" else "your child" }
        return (if (korean) ko[key] ?: key else key).replace("{child}", name)
    }

    @Composable
    fun step(current: Int, total: Int): String = if (LocalConfiguration.current.locales[0].language == "ko") "${total}단계 중 $current" else "STEP $current OF $total"

    private val ko = mapOf(
        "Create your caregiver account" to "보호자 계정 만들기",
        "Welcome! Let’s take this one step at a time." to "환영합니다! 한 단계씩 진행해요.",
        "Data and photo consent" to "정보 및 사진 이용 동의",
        "Consent is needed to continue." to "진행하려면 필수 항목에 동의해 주세요.",
        "Consent to Collection and Use of Personal Information" to "개인정보 수집 및 이용 동의",
        "Please review the information below and agree to continue." to "아래 내용을 확인하고 동의해 주세요.",
        "Tell us about your child" to "아이에 대해 알려주세요",
        "A few basics help us give better recommendations and output." to "기본 정보는 더 적절한 제안에 도움이 됩니다.",
        "Food allergies" to "식품 알레르기",
        "Select every known allergy. Help avoid foods that should not be suggested to {child}." to "{child}에게 알레르기를 일으키는 음식을 모두 선택해 주세요.",
        "Safety-critical" to "안전 정보",
        "Always check labels, preparation and cross-contact yourself. The app does not replace medical advice." to "식품 표시와 조리 과정, 교차 접촉을 직접 확인해 주세요. 앱은 의료 조언을 대신하지 않습니다.",
        "Other dietary restrictions" to "기타 식이 제한",
        "Help us avoid foods that may not be safe or suitable for {child}." to "{child}에게 적합하지 않은 음식을 피하도록 도와주세요.",
        "Are there any other foods or ingredients {child} needs to avoid?" to "{child}에게 피해야 할 음식이나 재료가 있나요?",
        "Select all that apply. Add other restrictions below." to "해당하는 항목을 모두 선택하고, 필요하면 아래에 추가해 주세요.",
        "Foods the family includes" to "가족 식단에 포함하는 음식",
        "Select food groups your household is comfortable including. This is about family preferences, not only foods {child} currently likes or dislikes." to "가족 식단에 포함할 식품군을 선택해 주세요. 현재 {child}의 선호 여부와는 별개입니다.",
        "Included food groups" to "포함하는 식품군",
        "This helps us prioritize foods that fit your family routine." to "가족의 식사 습관에 맞는 음식을 우선하는 데 도움이 됩니다.",
        "Dietary approaches" to "식이 방식",
        "Which approaches fit your family?" to "가족이 따르는 식이 방식이 있나요?",
        "Choose any that apply, or select none." to "해당하는 항목을 선택하거나 없음을 선택해 주세요.",
        "Sensory Profile" to "감각 프로필",
        "Which food textures are often difficult for {child}?" to "{child}에게 어려운 음식 식감은 무엇인가요?",
        "Are strong food smells often difficult for {child}?" to "{child}에게 강한 음식 냄새가 어렵나요?",
        "For example, strong smells from fish, cooked onions, or some cooked vegetables." to "예: 생선, 익힌 양파 또는 일부 채소의 강한 냄새",
        "Which tastes are often difficult for {child}?" to "{child}에게 어려운 맛은 무엇인가요?",
        "Are any of these presentation details important for {child}?" to "{child}에게 중요한 음식 제공 방식이 있나요?",
        "Select the ones that often affect whether (and how) {child} accepts a food." to "음식을 받아들이는 데 영향을 주는 조건을 선택해 주세요.",
        "What serving temperatures work best?" to "어떤 음식 온도를 선호하나요?",
        "Familiarity with new foods" to "새로운 음식에 대한 반응",
        "When {child} sees a new food for the first time, what usually happens?" to "새로운 음식을 처음 봤을 때 {child}의 반응은 어떤가요?",
        "First response" to "첫 반응",
        "This is only a general starting point. It does not assign a permanent exposure step." to "이는 일반적인 시작점이며 음식별 경험 단계를 자동으로 정하지 않습니다.",
        "{child}’s Safe foods" to "{child}의 안심 음식",
        "Add foods that {child} reliably accepts in a familiar form. We can use these foods as familiar starting points when suggesting something new." to "익숙한 형태로 꾸준히 먹는 {child}의 음식을 추가해 주세요.",
        "Safe foods" to "안심 음식",
        "Add a food and an optional preparation or serving note." to "음식과 조리·제공 정보를 추가해 주세요.",
        "Review {child}’s profile" to "{child}의 프로필 검토",
        "You’re in control. Edit any section now or later in Profile Settings." to "각 항목을 지금 또는 나중에 수정할 수 있습니다.",
        "Profile summary" to "프로필 요약",
        "No known food allergies" to "알려진 식품 알레르기 없음",
        "Peanuts" to "땅콩", "Tree nuts" to "견과류", "Milk / Dairy" to "우유 / 유제품", "Eggs" to "달걀", "Soy" to "대두", "Wheat" to "밀", "Fish" to "생선", "Shellfish" to "갑각류·조개류", "Sesame" to "참깨", "Other allergy" to "기타 알레르기",
        "No additional dietary restrictions" to "추가 식이 제한 없음", "Gluten-free" to "글루텐 제외", "Lactose-free" to "유당 제외", "Low fructose" to "저과당", "Casein-free" to "카제인 제외", "Other restrictions" to "기타 제한",
        "Dairy" to "유제품", "Seafood" to "해산물", "Poultry" to "가금류", "Red meat" to "붉은 고기", "Legumes / soy" to "콩류 / 대두", "Nuts / seeds" to "견과류 / 씨앗", "Other" to "기타",
        "No specific approach" to "특정 식이 방식 없음", "Gluten-free and casein-free" to "글루텐·카제인 제외", "No added sugar / limited artificial additives" to "첨가당 없음 / 인공첨가물 제한", "Low-fructose" to "저과당", "Low sodium" to "저나트륨", "Ketogenic" to "케톤식",
        "No clear texture difficulty" to "뚜렷하게 어려운 식감 없음", "Smooth / creamy" to "부드럽고 크리미함", "Soft / mushy" to "무르고 질척함", "Lumpy / chunky" to "덩어리가 있음", "Crunchy / crisp" to "바삭함", "Chewy / tough" to "질김", "Wet / slippery" to "축축하거나 미끄러움", "Mixed textures" to "여러 식감이 섞임", "Other texture" to "기타 식감",
        "Yes" to "예", "Sometimes" to "가끔", "No" to "아니요", "Not sure" to "잘 모르겠어요",
        "No clear taste difficulty" to "뚜렷하게 어려운 맛 없음", "Bitter" to "쓴맛", "Sour" to "신맛", "Spicy / hot" to "매운맛", "Very sweet" to "매우 단맛", "Very salty" to "매우 짠맛", "Other taste" to "기타 맛",
        "No presentation preferences" to "특별한 제공 방식 선호 없음", "Specific colors" to "특정 색", "Consistent shapes and sizes" to "일정한 모양과 크기", "Foods kept separate" to "음식끼리 닿지 않음", "Ingredients clearly visible" to "재료가 보임",
        "No clear preference" to "뚜렷한 선호 없음", "No clear temperature preference" to "뚜렷한 온도 선호 없음", "Cool / chilled" to "차갑게", "Room temperature" to "상온", "Warm" to "따뜻하게", "Hot" to "뜨겁게", "It depends on the food" to "음식에 따라 다름",
        "Usually tastes a new food" to "대체로 새로운 음식을 맛봄", "Okay on the plate, may not taste" to "접시에 놓여도 괜찮지만 맛보지 않을 수 있음", "Prefers it nearby but separate" to "가까이 두되 따로 놓기를 원함", "Wants it removed" to "치워 달라고 함", "Varies by food" to "음식에 따라 다름",
        "Under 2 years" to "2세 미만", "2–3 years" to "2~3세", "4–5 years" to "4~5세", "6–8 years" to "6~8세", "9–12 years" to "9~12세", "13+ years" to "13세 이상",
        "PARENT OR CAREGIVER FULL NAME" to "부모 또는 보호자 이름", "Name" to "이름", "EMAIL" to "이메일", "Email" to "이메일", "PASSWORD" to "비밀번호", "Password" to "비밀번호", "NICKNAME" to "닉네임", "Child’s nickname" to "아이의 닉네임", "AGE RANGE" to "연령대",
        "Use any name your family is comfortable with." to "가족에게 편한 이름을 사용하세요.", "We ask for an age range, not an exact birth date, to reduce unnecessary personal data." to "필요하지 않은 개인정보 수집을 줄이기 위해 정확한 생년월일 대신 연령대만 묻습니다.",
        "Required checks must be completed before continuing." to "필수 항목에 동의해야 계속할 수 있습니다.", "Account and care privacy" to "계정 및 돌봄 정보", "Photo analysis and personalization" to "사진 분석 및 개인화", "AI training and model research" to "AI 학습 및 모델 연구", "Required · account and care information" to "필수 · 계정 및 돌봄 정보", "Required · photo analysis and personalization" to "필수 · 사진 분석 및 개인화", "Optional · help improve future models" to "선택 · 향후 모델 개선에 도움", "REQUIRED" to "필수", "OPTIONAL" to "선택",
        "Safety and recommendation limits\nThe app does not diagnose conditions or replace medical advice. Always check labels and allergen declarations." to "안전 및 추천의 한계\n앱은 질환을 진단하거나 의료 조언을 대신하지 않습니다. 식품 표시와 알레르기 정보를 확인해 주세요.",
        "OTHER" to "기타", "OTHER ALLERGY" to "기타 알레르기", "Type a food or category" to "음식 또는 분류 검색", "Type an allergy or ingredient" to "알레르기 또는 재료 검색", "Type a dietary approach" to "식이 방식 검색", "Type a restriction" to "제한 항목 검색", "Type a texture" to "식감 직접 입력", "Type a taste" to "맛 직접 입력", "Type a presentation" to "제공 방식 직접 입력", "Add one item at a time." to "한 번에 한 항목씩 추가하세요.", "Add" to "추가", "All" to "전체 선택", "No results" to "검색 결과가 없습니다.",
        "Safety-critical\nCheck ingredient labels and cross-contact. Recommendations pause when allergy details are unknown." to "안전 정보\n재료 표시와 교차 접촉을 확인해 주세요. 알레르기 정보가 불확실하면 추천이 보류됩니다.", "We use these safety details when checking future food suggestions." to "향후 음식 제안을 확인할 때 이 안전 정보를 사용합니다.", "Multiple selections allowed" to "여러 항목 선택 가능", "Single selection" to "한 항목 선택",
        "SAFE FOODS" to "안심 음식", "Foods {child} reliably accepts in a familiar form." to "{child}에게 익숙한 형태로 꾸준히 먹는 음식입니다.", "Add a familiar food" to "익숙한 음식 추가", "Add safe food" to "안심 음식 추가", "FOOD NAME" to "음식 이름", "Food name" to "음식 이름", "PREPARATION" to "조리 방법", "Preparation" to "조리 방법", "PRESENTATION NOTE · OPTIONAL" to "제공 메모 · 선택", "Optional serving note" to "선택 입력: 제공 메모", "No safe foods yet" to "아직 안심 음식 없음", "Remove" to "삭제",
        "Safety restrictions" to "안전 제한", "Family practices" to "가족 식단", "Sensory tendencies" to "감각 경향", "Child basics" to "아이 기본 정보", "Presentation" to "제공 방식", "Serving temperature" to "제공 온도", "Taste intensity" to "맛 강도", "Food smell" to "음식 냄새", "New-food familiarity" to "새로운 음식에 대한 반응", "Allergies:" to "알레르기:", "Not specified" to "미입력", "None added" to "추가한 음식 없음",
        "Previous" to "이전", "Continue" to "계속", "Looks good" to "이대로 저장", "Save & exit" to "저장하고 나가기", "Auto-saved" to "자동 저장됨", "Saving…" to "저장 중…",
        "Log a meal" to "식사 기록", "Notice reactions" to "반응 살펴보기", "Choose a next step" to "다음 단계 선택", "Capture what was served and the form it was offered in." to "제공한 음식과 형태를 기록하세요.", "Record what your child ate, explored, or avoided." to "아이가 먹거나 살펴보거나 피한 것을 기록하세요.", "Use the history to choose one small change for next time." to "기록을 바탕으로 다음에 시도할 작은 변화를 선택하세요.", "Log first meal" to "첫 식사 기록", "Next" to "다음", "Go to Home" to "홈으로", "Skip tutorial" to "안내 건너뛰기", "Back" to "뒤로", "Example" to "예시",
        "Use at least 8 characters" to "8자 이상 입력해 주세요.", "Password is too short. Please enter at least 8 characters." to "비밀번호가 너무 짧습니다. 8자 이상 입력해 주세요.",
        "Saved for later" to "나중에 이어서 하기", "Your answers are saved. Continue whenever you are ready." to "지금까지 입력한 내용이 저장되었습니다. 준비되면 이어서 작성하세요.", "Resume onboarding" to "온보딩 이어하기",
        "Lupin" to "루핀", "Lupin flour" to "루핀 가루", "Lupin seed" to "루핀 씨앗", "Mustard" to "겨자", "Celery" to "셀러리", "Low-histamine" to "저히스타민", "Low-salicylate" to "저살리실산", "Low-FODMAP" to "저포드맵", "Corn-free" to "옥수수 제외", "Plant-based milk" to "식물성 우유", "Plant-based yogurt" to "식물성 요거트", "Plant-based cheese" to "식물성 치즈", "Tofu" to "두부", "Quinoa" to "퀴노아", "Mediterranean" to "지중해식",
    )
}


class AfterMealReviewText(private val korean: Boolean) {
    fun goalLabel(value: String): String = if (value in listOf("Step 1 · Look", "1단계 · 바라보기")) { if (korean) "1단계 · 바라보기" else "Step 1 · Look" } else value
    val continueLabel get() = if (korean) "계속" else "Continue"
    val title get() = if (korean) "식후 검토" else "After-meal Review"
    val selectMeal get() = if (korean) "저장된 식사를 선택하세요" else "Choose a saved meal"
    val emptyMeals get() = if (korean) "식사를 저장한 뒤 식후 반응을 기록할 수 있어요." else "Save a meal first to review what happened."
    val loadError get() = if (korean) "식사를 불러오지 못했어요. 다시 시도해 주세요." else "Could not load this meal. Please retry."
    val retry get() = if (korean) "다시 시도" else "Retry"
    val afterPhoto get() = if (korean) "식후 사진" else "After-meal photo"
    val addPhoto get() = if (korean) "식후 사진 추가" else "Add an after-meal photo"
    val compare get() = if (korean) "식전·식후 비교" else "Compare before and after"
    val before get() = if (korean) "식전" else "BEFORE"
    val after get() = if (korean) "식후" else "AFTER"
    val compareAI get() = if (korean) "AI로 비교" else "Compare with AI"
    val manual get() = if (korean) "결과 직접 입력" else "Enter outcomes manually"
    val photoConsent get() = if (korean) "비교를 시작하면 이 식사의 두 사진을 분석 제공자에게 전송하는 데 동의하게 됩니다. 별도 동의 없이 AI 학습에 사용하지 않습니다." else "By comparing, you consent to sending both meal photos to the analysis provider for this meal. They will not be used to train AI without separate consent."
    val photoUse get() = if (korean) "사진 데이터 사용 안내" else "How photo data is used"
    val photoDetails get() = if (korean) "분석 또는 저장을 선택하기 전까지 사진은 기기에 보관됩니다. 현재 프로토타입은 mock API로 기기 안에서 비교합니다." else "Photos stay on your device until you choose analysis or save. This prototype compares locally using a mock API."
    val comparing get() = if (korean) "사진 비교 중…" else "Comparing photos…"
    val comparingDetail get() = if (korean) "식전·식후 사진을 확인하고 있어요. 초안은 자동 저장됩니다." else "Checking the before and after photos. Your draft is being saved."
    val cancelSafely get() = if (korean) "안전하게 취소" else "Cancel safely"
    val compareFailed get() = if (korean) "사진을 비교하지 못했어요" else "We couldn’t compare the photos"
    val analysisFailed get() = if (korean) "분석 실패" else "Analysis Failed"
    val photosSafe get() = if (korean) "사진과 입력은 그대로 보관됩니다. 다시 시도하거나 직접 기록해 주세요." else "Your photos and answers are safe. Retry or enter outcomes manually."
    val retryComparison get() = if (korean) "비교 다시 시도" else "Retry comparison"
    val photoUnavailable get() = if (korean) "사진을 불러올 수 없어요. 다른 사진을 선택하거나 결과를 직접 입력하세요." else "Photo unavailable. Select another image or enter outcomes manually."
    val outcomes get() = if (korean) "각 음식에 어떤 반응을 보였나요?" else "What happened with each food item?"
    val outcomeHint get() = if (korean) "AI 제안은 보호자가 선택하거나 수정하기 전까지 확정되지 않습니다." else "AI suggestions are not confirmed until you edit or select a value."
    val manualHint get() = if (korean) "각 음식과 재료에 대해 관찰한 결과를 선택해 주세요." else "Select the outcome you observed for every food and ingredient."
    val suggested get() = if (korean) "제안" else "SUGGESTED"
    val confirmed get() = if (korean) "확정됨" else "Confirmed"
    val editInfo get() = if (korean) "정보 수정" else "edit info"
    val definitions get() = if (korean) "결과의 의미" else "Outcome definitions"
    val gotIt get() = if (korean) "알겠어요" else "Got it"
    val unanswered get() = if (korean) "미응답" else "Unanswered"
    val missing get() = if (korean) "표시된 항목에 모두 답해 주세요. 알 수 없다면 확인 어려움을 선택하세요." else "Please answer every highlighted item. Choose Unclear if you cannot tell."
    val noFoods get() = if (korean) "결과를 기록할 음식을 먼저 추가해 주세요." else "Add at least one served food to record outcomes."
    val definitionNote get() = if (korean) "정확한 양을 추정할 필요는 없어요. 미응답 항목은 확정 저장할 수 없습니다." else "You do not need to estimate an exact amount. Unanswered items cannot be saved."
    val difficulty get() = if (korean) "이 음식을 어려워한 이유가 있나요?" else "What made this food difficult?"
    val difficultyHint get() = if (korean) "일부 카테고리는 여러 값을 추가할 수 있어요" else "Some categories allow multiple value selections"
    val category get() = if (korean) "카테고리 선택" else "Select category"
    val value get() = if (korean) "값 선택" else "Value"
    val add get() = if (korean) "+ 추가" else "+ Add"
    val note get() = if (korean) "선택 메모" else "Optional note"
    val custom get() = if (korean) "내용을 입력하세요" else "Describe it"
    val skip get() = if (korean) "건너뛰기" else "Skip"
    val goal get() = if (korean) "이번 식사의 음식 경험 목표" else "This meal’s exposure goal is:"
    val record get() = if (korean) "어떤 일이 있었는지 기록" else "Record what happened"
    val recordHint get() = if (korean) "이 음식에 대해 실제로 관찰한 경험만 선택하세요." else "Select only the step you observed for this food."
    val noStep get() = if (korean) "이 음식의 목표 단계는 아직 설정되지 않았어요." else "No step was selected for this food."
    val savedSuggestions get() = if (korean) "저장한 제안을 시도했나요?" else "Did you try a saved suggestion?"
    val swipe get() = if (korean) "오른쪽은 시도함, 왼쪽은 시도하지 않음" else "Swipe right for yes, left for no."
    val saved get() = if (korean) "저장됨" else "SAVED"
    val what get() = if (korean) "시도할 일" else "WHAT TO TRY"
    val why get() = if (korean) "더 쉬울 수 있는 이유" else "WHY THIS MAY BE EASIER"
    val servingTip get() = if (korean) "제공 팁" else "SERVING TIP"
    val yes get() = if (korean) "시도했어요" else "Tried it"
    val no get() = if (korean) "시도하지 않았어요" else "Did not try"
    val nextStep get() = if (korean) "추천하는 다음 단계" else "Recommended next step"
    val done get() = if (korean) "식후 기록을 저장했어요" else "After-meal review saved"
    val noRecommendation get() = if (korean) "확인한 결과가 저장되었습니다. 아직 제공할 수 있는 다음 제안이 없어요." else "Your confirmed outcomes are saved. There is no next suggestion available yet."
    val finish get() = if (korean) "식후 기록 저장" else "Save review"
    val home get() = if (korean) "홈으로" else "Go to Home"
    val exit get() = if (korean) "저장하고 나가기" else "Save & exit"
    val editAgain get() = if (korean) "기록 다시 보기" else "Review answers"
    val seconds get() = if (korean) "초" else "sec"
    val foodItems get() = if (korean) "개 음식" else "food items"
    val cards get() = if (korean) "개 카드" else "cards"
    val close get() = if (korean) "닫기" else "Close"
    fun outcome(value: com.mca.myapplication.data.FoodOutcome): String = (if (korean) listOf("먹음", "맛봄", "먹거나 맛보지 않음", "확인 어려움") else listOf("Eaten", "Tasted", "Untouched", "Unclear"))[value.ordinal]
    fun definition(value: com.mca.myapplication.data.FoodOutcome): String = (if (korean) listOf("삼킨 양이 확인됨.", "핥거나 맛봤지만 삼킨 것은 확인되지 않음.", "먹거나 맛보지 않음. 보기·냄새 맡기·만지기·옮기기는 별도 경험으로 기록할 수 있어요.", "실제로 어떤 일이 있었는지 판단할 수 없음.") else listOf("Some amount was confirmed swallowed.", "Licked or tasted; swallowing was not confirmed.", "Neither eaten nor tasted. Looking, smelling, touching, or moving can be recorded separately.", "You cannot tell what actually happened."))[value.ordinal]
    fun option(key: String): String = if (korean) optionTranslations[key] ?: key else key
    private val optionTranslations = mapOf(
        "Texture" to "식감",
        "Taste type" to "맛 종류",
        "Taste intensity" to "맛 강도",
        "Smell" to "냄새",
        "Color" to "색",
        "Shape and size" to "모양과 크기",
        "Ingredient visibility" to "재료 가시성",
        "Temperature" to "온도",
        "Not sure" to "잘 모르겠어요",
        "Smooth / creamy" to "부드럽고 크리미함",
        "Soft / mushy" to "무르고 질척함",
        "Lumpy / chunky" to "덩어리가 있음",
        "Crunchy / crisp" to "바삭함",
        "Chewy / tough" to "질김",
        "Wet / slippery" to "축축하거나 미끄러움",
        "Mixed textures" to "여러 식감이 섞임",
        "Other" to "기타",
        "Sweet" to "단맛",
        "Salty" to "짠맛",
        "Sour" to "신맛",
        "Bitter" to "쓴맛",
        "Spicy / hot" to "매운맛",
        "Mild" to "약함",
        "Strong" to "강함",
        "No noticeable smell" to "뚜렷한 냄새 없음",
        "Red" to "빨강",
        "Orange" to "주황",
        "Yellow" to "노랑",
        "Green" to "초록",
        "Blue" to "파랑",
        "Purple" to "보라",
        "Brown" to "갈색",
        "Black" to "검정",
        "White" to "하양",
        "Gray" to "회색",
        "Others" to "기타",
        "Consistent" to "일정함",
        "Varied" to "다양함",
        "Optional note" to "선택 메모",
        "Clearly visible" to "잘 보임",
        "Partly visible" to "일부 보임",
        "Blended / not separately visible" to "섞여서 구분하기 어려움",
        "Hot" to "뜨거움",
        "Warm" to "따뜻함",
        "Room temperature" to "상온",
        "Cool / chilled" to "차가움",
    )
}

object AfterMealReviewTexts {
    val current: AfterMealReviewText
        @Composable get() = AfterMealReviewText(LocalConfiguration.current.locales[0].language == "ko")
}

class RecommendationText(private val korean: Boolean) {
    val title get() = if (korean) "추천하는 다음 단계" else "Recommended next step"
    val subtitle get() = if (korean) "기록을 바탕으로 작은 변화를 골라보세요." else "Choose a small change based on your records."
    val recommended get() = if (korean) "추천" else "RECOMMENDED"
    val what get() = if (korean) "시도할 일" else "WHAT TO TRY"
    val why get() = if (korean) "더 쉬울 수 있는 이유" else "WHY THIS MAY BE EASIER"
    val tip get() = if (korean) "제공 팁" else "SERVING TIP"
    val save get() = if (korean) "제안 저장" else "Save suggestion"
    val skip get() = if (korean) "넘기기" else "Skip suggestion"
    val back get() = if (korean) "뒤로" else "Go back"
    val retry get() = if (korean) "다시 시도" else "Retry"
    val saved get() = if (korean) "저장된 제안" else "Saved suggestions"
    val tryAction get() = if (korean) "보기" else "Try"
    val empty get() = if (korean) "완료된 식후 기록이 없어요. 식후 기록을 저장한 뒤 확인해 주세요." else "There is no completed review yet. Save an after-meal review first."
    val incomplete get() = if (korean) "먼저 이 식사의 식후 결과를 모두 확인하고 저장해 주세요." else "Confirm and save all outcomes for this meal first."
    val safety get() = if (korean) "알레르기·식이 제한 또는 재료의 안전성을 확인할 수 없어 제안을 보류했어요. 프로필과 음식 정보를 확인해 주세요." else "Suggestions are paused because allergies, dietary restrictions, or ingredients cannot be verified. Check the profile and food details."
    val evidence get() = if (korean) "현재 기록으로는 개인화된 다음 단계를 설명할 근거가 부족해요." else "There is not enough confirmed information to explain a personalized next step."
    val exhausted get() = if (korean) "이 식사의 제안을 모두 살펴봤어요." else "You have reviewed all suggestions for this meal."
    val error get() = if (korean) "제안을 불러오거나 저장하지 못했어요. 다시 시도해 주세요." else "Could not load or save suggestions. Please retry."
    val safetyNote get() = if (korean) "식품 표시와 교차 접촉 가능성을 직접 확인해 주세요. 이 제안은 의료 조언이 아닙니다." else "Check labels and cross-contact yourself. This suggestion is not medical advice."
    val checkProfile get() = if (korean) "프로필 확인" else "Review profile"
    val checkMeal get() = if (korean) "식사 정보 확인" else "Review meal details"
    fun title(card: com.mca.myapplication.data.SavedSuggestion): String = when (card.kind) {
        "SEPARATE" -> if (korean) "${card.foodName}을(를) 다른 음식과 따로 제공해 보세요" else "Serve ${card.foodName} separately"
        "VISIBLE", "VISIBLE_RECORDED" -> if (korean) "${card.foodName}의 재료가 보이게 제공해 보세요" else "Keep the ingredients of ${card.foodName} visible"
        else -> card.title
    }
    fun reason(card: com.mca.myapplication.data.SavedSuggestion): String = when (card.kind) {
        "SEPARATE" -> if (korean) "프로필에 음식끼리 닿지 않는 제공 방식을 선호한다고 기록되어 있어요. 이 음식의 식후 결과도 확인했어요." else "The profile notes a preference for keeping foods separate, and this food has a confirmed outcome."
        "VISIBLE" -> if (korean) "프로필에 재료가 보이는 제공 방식을 선호한다고 기록되어 있어요. 이 음식의 식후 결과도 확인했어요." else "The profile notes a preference for visible ingredients, and this food has a confirmed outcome."
        "VISIBLE_RECORDED" -> if (korean) "식후 기록에 재료가 섞여 구분하기 어려웠다고 남겼어요. 이 음식의 식후 결과도 확인했어요." else "The after-meal record notes that blended ingredients were difficult to distinguish, and this food has a confirmed outcome."
        else -> card.reason
    }
    fun tip(card: com.mca.myapplication.data.SavedSuggestion): String = when (card.kind) {
        "SEPARATE" -> if (korean) "같은 음식을 접시의 별도 칸에 담아 보세요." else "Put the same food in a separate section of the plate."
        "VISIBLE", "VISIBLE_RECORDED" -> if (korean) "같은 재료를 덮거나 섞지 않고 보여 주세요." else "Show the same ingredients without covering or mixing them."
        else -> card.servingTip
    }
}

object RecommendationTexts {
    val current: RecommendationText
        @Composable get() = RecommendationText(LocalConfiguration.current.locales[0].language == "ko")
}

class HomeText(private val korean: Boolean) {
    private val locale get() = if (korean) java.util.Locale.KOREAN else java.util.Locale.ENGLISH
    val tabs get() = if (korean) listOf("오늘", "식사 기록", "SOS", "아이디어", "인사이트", "프로필")
        else listOf("Today", "Meal Log", "SOS", "Ideas", "Insight", "Profile")
    val nextUp get() = if (korean) "다음 식사" else "NEXT UP"
    val ready get() = if (korean) "준비되면 기록해 주세요" else "Ready when you are"
    val photoHint get() = if (korean) "사진 한 장으로 제공한 음식을 기록할 수 있어요." else "A quick photo helps record what was served."
    val logMeal get() = if (korean) "식사 기록하기" else "Log this meal"
    val sosTitle get() = if (korean) "SOS 진행 상황" else "SOS Progress"
    val sosSubtitle get() = if (korean) "기록한 음식 경험" else "Recorded food progress"
    val sosEmpty get() = if (korean) "아직 기록된 음식 경험 단계가 없어요." else "No food exposure steps recorded yet."
    val recommendedTitle get() = if (korean) "추천 행동 목표" else "Recommended action goals"
    val recommendedSubtitle get() = if (korean) "다음 식사를 위한 작은 변화" else "Small steps to make meals easier"
    val noRecommendation get() = if (korean) "저장된 제안이 없어요." else "No saved suggestions yet."
    val seeIdeas get() = if (korean) "제안 보기" else "See ideas"
    val tryAction get() = if (korean) "보기" else "Try"
    val calendarTitle get() = if (korean) "식사 기록 달력" else "Meal Log Calendar"
    val calendarSubtitle get() = if (korean) "진한 파랑은 기록한 날, 연한 파랑은 기록하지 않은 날" else "Logged days in dark blue, unlogged days in light blue"
    val logged get() = if (korean) "기록함" else "Logged"
    val unlogged get() = if (korean) "기록 없음" else "Unlogged"
    val weekdays get() = if (korean) listOf("월", "화", "수", "목", "금", "토", "일") else listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    val loadError get() = if (korean) "홈 정보를 불러오지 못했어요." else "Could not load your home information."
    val retry get() = if (korean) "다시 시도" else "Retry"
    val noMeals get() = if (korean) "저장된 식사가 없어요." else "No saved meals yet."
    val noInsights get() = if (korean) "표시할 인사이트가 아직 없어요." else "No insights available yet."
    val draftTitle get() = if (korean) "작성 중인 식사가 있어요" else "You have a meal draft"
    val draftMessage get() = if (korean) "이어서 작성하거나 새 식사를 시작할 수 있어요." else "Continue the draft or start a new meal."
    val resumeDraft get() = if (korean) "초안 이어쓰기" else "Resume draft"
    val newMeal get() = if (korean) "새 식사 시작" else "Start new meal"
    val reviewDraft get() = if (korean) "이 식사 식후 기록하기" else "Review this meal after eating"
    val reviewDraftHint get() = if (korean) "초안을 확인하고 저장하면 식후 기록으로 이어집니다." else "Confirm and save this draft to continue to after-meal review."
    val cancel get() = if (korean) "취소" else "Cancel"
    val mealReview get() = if (korean) "식후 기록" else "After-meal Review"
    val profileNameMissing get() = if (korean) "안녕하세요" else "Hello"
    fun items(count: Int) = if (korean) "${count}개" else "$count ${if (count == 1) "item" else "items"}"
    fun stage(number: Int) = if (korean) "${number}단계" else "Stage $number"
    fun stageDescription(number: Int) = (if (korean) listOf("보기", "상호작용", "냄새 맡기", "만지기", "맛보기 / 핥기", "삼키기")
        else listOf("Look", "Interact", "Smell", "Touch", "Taste / Lick", "Swallow")).getOrNull(number - 1).orEmpty()
    fun date(now: Long): String = java.text.SimpleDateFormat(if (korean) "M월 d일 EEEE" else "EEEE · d MMMM", locale).format(java.util.Date(now)).uppercase(locale)
    fun month(now: Long): String = java.text.SimpleDateFormat(if (korean) "M월" else "MMM", locale).format(java.util.Date(now))
    fun greeting(now: Long, name: String): String {
        val hour = java.util.Calendar.getInstance().apply { timeInMillis = now }.get(java.util.Calendar.HOUR_OF_DAY)
        val part = if (korean) "안녕하세요" else when (hour) { in 5..11 -> "Good morning"; in 12..17 -> "Good afternoon"; else -> "Good evening" }
        return if (name.isBlank()) part else if (korean) "${name}님, $part" else "$part, $name"
    }
}

object HomeTexts {
    val current: HomeText
        @Composable get() = HomeText(LocalConfiguration.current.locales[0].language == "ko")
}
