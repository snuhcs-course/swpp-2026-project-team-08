// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

const { React, act, renderHook } = require('../helpers/react-harness.cjs');

const { renderToStaticMarkup } = require('react-dom/server');

for (const ext of ['.svg', '.png']) require.extensions[ext] = (m, file) => { m.exports = file; };

const flatten = (value) => Object.assign({}, ...[value].flat(Infinity).filter(Boolean));

function primitive(tag) { return function Primitive({ children, style, accessibilityLabel, accessibilityState, accessibilityRole, testID, onPress, onChangeText, value, placeholder, ...props }) {
  const css = flatten(typeof style === 'function' ? style({ pressed: false }) : style);
  const safeProps = { style: css, role: accessibilityRole, 'aria-label': accessibilityLabel, 'data-testid': testID };
  if (accessibilityState) for (const [key, v] of Object.entries(accessibilityState)) safeProps[`aria-${key}`] = v;
  if (tag === 'input') Object.assign(safeProps, { value, placeholder, readOnly: true });
  return React.createElement(tag, safeProps, children);
}; }

const { mockModules } = require('../helpers/mock-modules.cjs');
mockModules((name) => {
  if (name === 'react-native') return { RefreshControl: () => null, ActivityIndicator: primitive('progress'), View: primitive('div'), Text: primitive('span'), Pressable: primitive('button'), TextInput: primitive('input'), ScrollView: primitive('section'), KeyboardAvoidingView: primitive('div'), Modal: ({visible = true, children}) => visible ? children : null, Platform: { OS: 'web' }, StyleSheet: { create: v => v, absoluteFill: {} } };
  if (name === 'react-native-safe-area-context') return { SafeAreaView: primitive('main') };
  if (name === 'expo-image') return { Image: primitive('img') };
  if (name === '@expo/vector-icons') return { Feather: primitive('i') };
  if (name.startsWith('@expo/vector-icons/')) return primitive('i');
  return undefined;
});

const { copyFor, abcCopyFor } = require('../../src/util/strings.ts');

const { newFood } = require('../../src/rules/foodDraft.ts');

const { newDraft } = require('../../src/features/meal-checkin/rules.ts');

const { MealFoodEditorDialog } = require('../../src/components/MealFoodEditorDialog.tsx');

const { MealFoodsStepView } = require('../../src/features/meal-checkin/screens/MealFoodsStepView.tsx');

const { Dialog } = require('../../src/components/Dialog.tsx');

const { AfterMealPhotoStepsView } = require('../../src/features/after-meal-review/screens/AfterMealPhotoStepsView.tsx');

const { HeightFitPhoto } = require('../../src/components/HeightFitPhoto.tsx');

const s=copyFor('en'), a=abcCopyFor('en'), noop=()=>{};

const closedLinking = { step: 0, selectedFoodId: '', canContinue: false, onOpen: noop, onBack: noop,
  onSelectSuggestion: noop, onSelectFood: noop, onContinue: noop, onUnlink: noop };

function editor(food=newFood(), mode='add') {
  return renderToStaticMarkup(React.createElement(MealFoodEditorDialog, { food, mode, meal:s.mealCheckin, common:s.common, labels:a, ingredient:'', onIngredientChange:noop,onAddIngredient:noop,onRemoveIngredient:noop,onChange:noop,onSave:noop,onCancel:noop }));
}

function homeProps() {
 return {profile:{id:'home-child',childName:'Luna',caregiverName:'Alex'},language:'en',now:new Date(2026,9,8,9),draft:null,draftLoading:false,draftError:false,pendingMeals:[],meals:[],data:{loggedDates:new Set(),suggestions:[]},loading:false,error:false,refreshing:false,onRefresh:noop,onLogMeal:noop,onReviewDraft:noop,onReviewMeal:noop,onSavedSuggestions:noop,onMealHistory:noop,onTrySuggestion:noop,suggestionText:{}};
}

test('new food dialog has empty inputs, disabled save, and no inferred food name', () => {
  const html=editor(); assert.match(html,/placeholder="Enter food name"/); assert.doesNotMatch(html,/Rolled omelet/);
  assert.match(html,/aria-label="Save food" aria-disabled="true"/); assert.match(html,/value=""/);
  assert.match(html,/flex-direction:row;align-items:flex-start;gap:8px/);
  assert.ok(html.indexOf('Cooking method') < html.indexOf('Additional detail'));
  assert.equal((html.match(/aria-checked="false"/g)||[]).length,4);
});

test('editing keeps caregiver food and optional details; adding does not change title after typing', () => {
  const food={...newFood(),name:'My soup',preparation:'Steamed',servingNote:'Small pieces',acceptance:0};
  const edit=editor(food,'edit');assert.match(edit,/>Edit My soup</);assert.match(edit,/value="My soup"/);assert.match(edit,/value="Small pieces"/);assert.match(edit,/aria-checked="true"/);
  assert.match(editor(food),/>Add food item</);
});

test('replacement dialog is centered and exposes body and small gray hint separately', () => {
  const html=renderToStaticMarkup(React.createElement(Dialog,{compact:true,title:a.replaceTitle,closeLabel:s.common.close,onClose:noop},
    React.createElement('p',{style:{fontSize:12}},a.replaceBody),React.createElement('p',{style:{fontSize:11,color:'#65758B'}},a.replaceHint)));
  assert.match(html,/justify-content:center;align-items:center/);assert.match(html,/max-width:342px/);
  assert.match(html,/font-size:11px;color:#65758B/);assert.doesNotMatch(html,/×/);
});

test('photo-free empty list has only entry guidance and the full-width add action', () => {
  const html=renderToStaticMarkup(React.createElement(MealFoodsStepView,{p:{draft:{...newDraft('test'),step:'foods'},language:'en',suggestions:[],suggestionLinking:closedLinking,onEdit:noop}}));
  assert.match(html,/Add the foods you served, with or without a photo/);assert.match(html,/Add food item/);
  assert.doesNotMatch(html,/No foods added yet|No Before-meal photo|previous suggestion/);
});

test('photo empty list has plain guidance and preserves the suggestion entry', () => {
  const html=renderToStaticMarkup(React.createElement(MealFoodsStepView,{p:{draft:{...newDraft('test'),step:'foods',photo:{uri:'test-photo'}},language:'en',childName:'Max',suggestions:[],suggestionLinking:closedLinking,onEdit:noop}}));
  assert.match(html,/No foods added yet/);assert.match(html,/Are you trying a previous suggestion/);
});

test('after-meal photo choice has no example photo, analysis action, or inferred results', () => {
  const html=renderToStaticMarkup(React.createElement(AfterMealPhotoStepsView,{p:{draft:{step:'photo'},language:'en',onPick:noop,onManual:noop,onSaveExit:noop}}));
  assert.match(html,/Continue without photo/); assert.match(html,/Enter food outcomes yourself/);
  assert.doesNotMatch(html,/Use good light|Compare with AI|Preview/);
});

test('height-fit photo reserves the full frame height and clips horizontal overflow', () => {
  const html=renderToStaticMarkup(React.createElement(HeightFitPhoto,{uri:'photo',height:228}));
  assert.match(html,/overflow:hidden;height:228px/); assert.match(html,/height:228px/);
});

test('button press does not forward a native event into an optional food argument', () => {
  const { AppButton } = require('../../src/components/AppButton.tsx');
  let args;
  const button = AppButton({ label:'Add',onPress:(...values)=>{args=values;} });
  button.props.onPress({nativeEvent:{type:'press'}});
  assert.deepEqual(args,[]);
});

test('save failure has a dedicated retry screen with the same meal and no extra foods', () => {
  const { MealSaveStatusView } = require('../../src/components/MealSaveStatusView.tsx');
  const html=renderToStaticMarkup(React.createElement(MealSaveStatusView,{status:'error',review:true,language:'en',photos:[],mealDate:'2026-10-18',mealType:'lunch',foods:[{...newFood(),name:'Caregiver soup'}],onRetry:noop,onSaveExit:noop,onReturn:noop}));
  assert.match(html,/We couldn’t save your meal/);assert.match(html,/Caregiver soup/);assert.match(html,/Retry/);assert.match(html,/same meal, not a new record/);
  assert.doesNotMatch(html,/Rolled omelet/);
});

test('draft suggestion linking opens explicitly and shows actual source meal metadata', () => {

  const p={draft:{...newDraft('test'),step:'foods',foods:[{...newFood(),name:'Soup'}]},language:'en',suggestions:[{id:'real-id',title:'Actual idea',description:'Try it small',mealDate:'2026-10-11',mealType:'lunch'}],suggestionLinking:closedLinking,onEdit:noop};
  const closed=renderToStaticMarkup(React.createElement(MealFoodsStepView,{p}));
  assert.match(closed,/Are you trying a previous suggestion/);
  assert.doesNotMatch(closed,/Step 1 of 2|Actual idea/);
  const html=renderToStaticMarkup(React.createElement(MealFoodsStepView,{p:{...p,suggestionLinking:{...closedLinking,step:1}}}));
  assert.match(html,/Step 1 of 2/);assert.match(html,/Oct 11, 2026/);assert.match(html,/Lunch/);assert.match(html,/Actual idea/);
});

test('onboarding review has the five Figma cards without discarding sensory answers', () => {
  const { emptyDraft } = require('../../src/features/onboarding/types.ts');
  const { reviewRows } = require('../../src/features/onboarding/screens/reviewRows.ts');
  const draft={...emptyDraft(),texture:['soft'],familiarity:'familiar',allergies:['peanut'],restrictions:['gluten-free']};
  const before=JSON.stringify(draft);
  const rows=reviewRows(draft,'en');
  assert.deepEqual(rows.map(row=>row.step),['child','allergies','family','approaches','safe-foods']);
  assert.match(rows[1].value,/Peanuts/); assert.equal(JSON.stringify(draft),before);
});

test('account keeps the small password helper separate from the error', () => {
  const { AccountStepView } = require('../../src/features/onboarding/screens/AccountStepView.tsx');
  const base={language:'en',caregiverName:'Test',email:'test@example.com',password:'12345678',editing:false,onNameChange:noop,onEmailChange:noop,onPasswordChange:noop};
  const valid=renderToStaticMarkup(React.createElement(AccountStepView,base));
  assert.match(valid,/Use at least 8 characters/);
  const invalid=renderToStaticMarkup(React.createElement(AccountStepView,{...base,password:'123',passwordError:s.onboarding.passwordTooShort}));
  assert.match(invalid,/Password is too short/);assert.doesNotMatch(invalid,/Use at least 8 characters/);
});

test('Figma other-food catalog examples are searchable in both supported languages', () => {
  const { optionsFor } = require('../../src/util/strings.ts');
  assert.deepEqual(optionsFor('allergyCatalog','en').filter(o=>o.label.toLowerCase().includes('lupin')).map(o=>o.label),['Lupin','Lupin flour','Lupin seed']);
  assert.deepEqual(optionsFor('familyCatalog','en').filter(o=>o.label.toLowerCase().includes('plant')).map(o=>o.label),['Plant-based milk','Plant-based yogurt','Plant-based cheese']);
  assert.equal(optionsFor('allergyCatalog','ko').find(o=>o.id==='lupin').label,'루핀');
  assert.equal(optionsFor('approachCatalog','en').some(o=>o.id==='low-histamine'),true);
});

test('ongoing meal entry shows real draft metadata and only an explicit continue action', () => {
  const { MealDraftResumeView } = require('../../src/features/meal-checkin/screens/MealDraftResumeView.tsx');
  const draft={...newDraft('child'),mealDate:'2026-10-11',mealType:'dinner',step:'foods',foods:[{...newFood(),name:'Soup'}],photo:{id:'photo',uri:'saved-photo'}};
  const before=JSON.stringify(draft);
  const html=renderToStaticMarkup(React.createElement(MealDraftResumeView,{draft,childName:'Alex',language:'en',onContinue:noop,onBack:noop}));
  assert.match(html,/Ongoing Meal/);assert.match(html,/Finish your draft before starting a new check-in/);
  assert.match(html,/Alex · Dinner/);assert.match(html,/11 October 2026/);assert.match(html,/Photo saved/);assert.match(html,/1 food/);assert.match(html,/Continue draft/);
  assert.doesNotMatch(html,/Add food item|Food name|Replace photo/);assert.equal(JSON.stringify(draft),before);
});

test('ongoing meal entry handles a photo-free empty draft without fake meal information', () => {
  const { MealDraftResumeView } = require('../../src/features/meal-checkin/screens/MealDraftResumeView.tsx');
  const html=renderToStaticMarkup(React.createElement(MealDraftResumeView,{draft:newDraft('child'),childName:'Alex',language:'en',onContinue:noop,onBack:noop}));
  assert.match(html,/No photo/);assert.match(html,/0 foods/);assert.doesNotMatch(html,/Lunch|Photo saved|Rolled omelet/);
});

test('saved-meal home renders real pending-review metadata and current Figma sections', () => {
 const { HomeView }=require('../../src/features/home/screens/HomeView.tsx');
 const meal={...newDraft('home-child'),id:'real-meal',mealType:'lunch',mealDate:'2026-10-08',foods:[{...newFood(),name:'Soup'},{...newFood(),name:'Rice'}]};
 const p={...homeProps(),meals:[meal],pendingMeals:[meal],data:{loggedDates:new Set(),suggestions:[{id:'idea',title:'Actual saved idea'}]}};
 const html=renderToStaticMarkup(React.createElement(HomeView,p));
 for(const text of ['Good morning, Alex','THURSDAY','LOG THIS MEAL · FOR LUNA','Log new meal','After-meal Review','Luna · Lunch','Oct 8, 2026','2 foods','Awaiting review','Saved Suggestions','Actual saved idea','View saved suggestions']) assert.ok(html.includes(text),text);
 assert.doesNotMatch(html,/SOS Progress|Recommended action goals|Meal Log Calendar|Put carrot next to fish/);
});

test('fresh home shows Sunday-first calendar and honest empty saved-suggestion state', () => {
 const { HomeView }=require('../../src/features/home/screens/HomeView.tsx');
 const html=renderToStaticMarkup(React.createElement(HomeView,homeProps()));
 assert.match(html,/Log this meal/);assert.match(html,/Meal Log Calendar/);assert.match(html,/No saved suggestions yet/);assert.match(html,/View meal history/);
 assert.ok(html.indexOf('>Sun<')<html.indexOf('>Mon<'));assert.doesNotMatch(html,/Awaiting review|Actual saved idea/);
});

test('home record read errors show retry instead of declaring a fresh account', () => {
 const { HomeView }=require('../../src/features/home/screens/HomeView.tsx');
 const html=renderToStaticMarkup(React.createElement(HomeView,{...homeProps(),error:true}));
 assert.match(html,/Could not load your records/);assert.match(html,/Retry/);assert.doesNotMatch(html,/No saved suggestions yet|Meal Log Calendar/);
});

test('Home and every other tab share the shared five-tab navigation', () => {
 const { BottomNavigation }=require('../../src/components/BottomNavigation.tsx');
 for (const selected of ['today','mealLog','ideas','insight','profile']) {
  const html=renderToStaticMarkup(React.createElement(BottomNavigation,{language:'en',selected,onSelect:noop}));
  assert.equal((html.match(/role="tab"/g)||[]).length,5);
  assert.doesNotMatch(html,/SOS/);assert.match(html,/Insight/);
  assert.match(html,/height:72px/);assert.match(html,/padding-left:22px|padding-horizontal:22px/);
 }
});

test('pressing a pending home card passes the existing meal ID without creating a new meal', () => {
 const { HomeView }=require('../../src/features/home/screens/HomeView.tsx');
 let opened;
 const meal={...newDraft('home-child'),id:'existing-meal',mealType:'dinner',mealDate:'2026-10-08',foods:[{...newFood(),name:'Soup'}]};
 const root=HomeView({...homeProps(),meals:[meal],pendingMeals:[meal],onReviewMeal:id=>{opened=id;}});
 const walk=node=>{
   if(!node||typeof node!=='object')return null;
   if(node.props?.accessibilityLabel?.endsWith('Awaiting review'))return node;
   for(const child of React.Children.toArray(node.props?.children)){const found=walk(child);if(found)return found;}
   return null;
 };
 const card=walk(root);assert.ok(card);assert.equal(opened,undefined);card.props.onPress();assert.equal(opened,'existing-meal');
});

test('difficulty Continue and Skip save directly without a suggestion confirmation step', async (t) => {
  const { AfterMealReviewView } = require('../../src/features/after-meal-review/screens/AfterMealReviewView.tsx');
  const { AppButton } = require('../../src/components/AppButton.tsx');

    let saves = 0;
    const transitions = [];
    const harness = await renderHook(t, () => AfterMealReviewView({ language:'en', draft:{step:'difficulties'}, meal:{foods:[]},
      canContinueOutcomes:true, saving:false, saveStatus:'saved', onSave:()=>saves++, onGo:step=>transitions.push(step) }));
    const buttons = [];
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === AppButton) buttons.push(node);
      React.Children.forEach(node.props?.children, visit);
    }
    visit(harness.current);
    for (const label of [s.common.continue, s.afterMealReview.skip]) {
      const button = buttons.find(item=>item.props.label === label);
      assert.ok(button, label); await act(async () => button.props.onPress());
    }
    assert.equal(saves, 2); assert.deepEqual(transitions, []);

});
