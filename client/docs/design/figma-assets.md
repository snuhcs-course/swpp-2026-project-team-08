# Figma assets

Source file: https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5

Icons were downloaded as SVG from the listed Figma nodes and converted to Android vector drawables in `app/src/main/res/drawable/`.
The camera node's SVG omitted its lens; the drawable includes the lens visible in Figma's full node export.
The School option uses the Figma graduation cap (`56:2545`). The Figma Others node exported a house shape, so the Others option uses a three-dot vector (`ic_meal_other.xml`).

- `ic_figma_arrow_right.xml` ← Figma `94:290`
- `ic_figma_back.xml` ← Figma `94:203`
- `ic_figma_breakfast.xml` ← Figma `94:229`
- `ic_figma_camera.xml` ← Figma `94:509`
- `ic_figma_check.xml` ← Figma `34:2864`
- `ic_figma_chevron_down.xml` ← Figma `94:222`
- `ic_figma_chevron_right.xml` ← Figma `94:513`
- `ic_figma_close.xml` ← Figma `34:2776`
- `ic_figma_cloud_check.xml` ← Figma `32:1197`
- `ic_figma_cloud_off.xml` ← Figma `34:2427`
- `ic_figma_dinner.xml` ← Figma `94:244`
- `ic_figma_expand.xml` ← Figma `34:2846`
- `ic_figma_file_image.xml` ← Figma `94:525`
- `ic_figma_gallery.xml` ← Figma `94:517`
- `ic_figma_help.xml` ← Figma `96:897`
- `ic_figma_home.xml` ← Figma `94:261`
- `ic_figma_info.xml` ← Figma `86:578`
- `ic_figma_lock.xml` ← Figma `34:2859`
- `ic_figma_lunch.xml` ← Figma `94:236`
- `ic_figma_more.xml` ← Figma `94:283`
- `ic_figma_plus.xml` ← Figma `96:906`
- `ic_figma_refresh.xml` ← Figma `34:2851`
- `ic_figma_restaurant.xml` ← Figma `94:268`
- `ic_figma_save.xml` ← Figma `34:2431`
- `ic_figma_school.xml` ← Figma `94:276`
- `ic_figma_shield_alert.xml` ← Figma `52:144`
- `ic_figma_shield_check.xml` ← Figma `96:910`
- `ic_figma_snack.xml` ← Figma `94:251`
- `ic_figma_sparkles.xml` ← Figma `34:2806`
- `ic_figma_trash.xml` ← Figma `34:2855`
- `ic_figma_utensils.xml` ← Figma `52:783`

`app/src/main/res/drawable-nodpi/meal_example_photo.jpg` is the original JPEG used in the before-meal photo example (`94:457`, preview image `94:487`).

`app/src/main/res/drawable-nodpi/review_goal_icon.png` is the original 23 × 23 lightbulb export from After-meal Review `72:689`, displayed at 23 dp inside the 48 dp goal icon surface.

Home `37:3607` uses these node exports, converted without redrawing their paths to Android vectors:

- The Home camera slot `37:3632` reuses `ic_figma_camera.xml`, whose vector includes the lens visible in the Figma frame.
- `ic_home_carrot.xml` ← `37:3644`
- `ic_home_circle_x.xml` ← `37:3654`
- `ic_home_home.xml` ← `37:3816`
- `ic_home_utensils.xml` ← `37:3820`
- `ic_home_alert.xml` ← `37:3825`
- `ic_home_sparkles.xml` ← `37:3830`
- `ic_home_chart.xml` ← `37:3834`
- `ic_home_user.xml` ← `37:3838`

The Home typography uses Poppins Regular, SemiBold, and Bold from Google Fonts. Its license is in `docs/licenses/Poppins-OFL.txt`.
