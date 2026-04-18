require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_CFG = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'smart_recipe_finder',
  multipleStatements: true
};

// ─── Recipe Helper ─────────────────────────────────────────────
function r(o){ return { id: uuidv4(), featured: 0, rating: 4.5, ...o }; }

// ─── Seed Data ─────────────────────────────────────────────────
const RECIPES = [
  // ══ BREAKFAST ══════════════════════════════════════════════
  r({ title:'Avocado Toast with Poached Eggs', meal_type:'Breakfast', category:'Breakfast', cuisine:'American', prep_time:5, cook_time:10, servings:2, difficulty:'Easy', featured:1, rating:4.6,
    description:'Elevated breakfast classic with perfectly toasted sourdough, smashed avocado, silky poached eggs, and chili flakes. Ready in under 15 minutes.',
    ingredients:['2 slices sourdough','2 ripe avocados','4 eggs','1 lemon','2 tbsp white vinegar','Chili flakes','Flaky sea salt','Extra virgin olive oil'],
    steps:['Toast sourdough until golden.','Mash avocados with lemon juice and salt.','Bring water with vinegar to gentle simmer. Create vortex, drop in egg, poach 3-4 min.','Spread avocado on toast. Top with poached egg.','Drizzle olive oil, sprinkle chili flakes.'],
    images:['https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=800','https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800'],
    video:'https://www.youtube.com/embed/ov6IfoBuVcY', tags:['breakfast','healthy','quick','vegetarian'] }),

  r({ title:'Masala Dosa', meal_type:'Breakfast', category:'Breakfast', cuisine:'Indian', prep_time:480, cook_time:30, servings:4, difficulty:'Hard', featured:1, rating:4.8,
    description:'South India\'s most celebrated breakfast — a crisp, golden fermented rice crepe filled with spiced potato masala, served with coconut chutney and sambar.',
    ingredients:['2 cups idli rice','1/2 cup urad dal','1/4 tsp fenugreek seeds','4 potatoes boiled','2 onions sliced','2 tsp mustard seeds','10 curry leaves','2 tsp turmeric'],
    steps:['Soak rice and dal 6 hrs. Blend smooth. Ferment overnight.','Boil, peel potatoes. Fry onions with mustard seeds, curry leaves, turmeric.','Mix potato with onion for masala filling.','Heat tawa, spread batter thin. Drizzle oil.','Add filling, fold dosa. Serve with chutney & sambar.'],
    images:['https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800'],
    video:'https://www.youtube.com/embed/sNJoVE4VjkI', tags:['indian','south indian','breakfast','dosa'] }),

  r({ title:'Aloo Paratha', meal_type:'Breakfast', category:'Breakfast', cuisine:'Indian', prep_time:30, cook_time:20, servings:8, difficulty:'Medium', featured:1, rating:4.8,
    description:'Stuffed flatbread with spiced mashed potato, cooked on a tawa with liberal butter. Punjab\'s ultimate breakfast comfort food.',
    ingredients:['3 cups whole wheat flour','3 large potatoes boiled','2 green chilies','1 tbsp ginger grated','2 tsp cumin','1 tsp amchur','Fresh coriander','Butter or ghee'],
    steps:['Knead smooth dough. Rest 20 mins.','Mash potatoes with spices, chili, ginger, coriander.','Flatten dough ball, place stuffing, seal, re-roll.','Cook on hot tawa with butter both sides until golden.','Serve with yogurt and pickle.'],
    images:['https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800'],
    video:'https://www.youtube.com/embed/bwtQNd_gT4Q', tags:['indian','paratha','breakfast','punjabi'] }),

  r({ title:'Idli Sambar', meal_type:'Breakfast', category:'Breakfast', cuisine:'Indian', prep_time:480, cook_time:30, servings:4, difficulty:'Medium', rating:4.6,
    description:'South India\'s quintessential breakfast — steamed fermented rice cakes with vegetable-lentil sambar and coconut chutney.',
    ingredients:['2 cups idli rice','1 cup urad dal','1 cup toor dal','Mixed vegetables','Sambar powder','Tamarind','Mustard seeds','Curry leaves','Fresh coconut for chutney'],
    steps:['Soak rice and dal 6 hrs. Grind smooth. Ferment overnight.','Steam idlis 12-15 minutes.','Cook toor dal. Sauté vegetables with sambar powder, tamarind.','Temper with mustard, curry leaves.','Blend coconut chutney. Serve everything together.'],
    images:['https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800'],
    video:'', tags:['indian','south indian','breakfast','healthy'] }),

  r({ title:'Classic French Toast', meal_type:'Breakfast', category:'Breakfast', cuisine:'French', prep_time:5, cook_time:10, servings:4, difficulty:'Easy', rating:4.5,
    description:'Thick-cut bread soaked in vanilla custard and pan-fried until golden — dusted with powdered sugar and served with fresh berries and maple syrup.',
    ingredients:['8 thick slices brioche or challah','3 eggs','150ml whole milk','1 tsp vanilla extract','1 tbsp sugar','Pinch of cinnamon','Butter for frying','Maple syrup, berries, powdered sugar to serve'],
    steps:['Whisk eggs, milk, vanilla, sugar, cinnamon.','Dip bread slices fully, let absorb 30 seconds.','Melt butter in pan on medium heat.','Fry bread 3 min each side until golden brown.','Dust with powdered sugar. Serve with maple syrup and berries.'],
    images:['https://images.unsplash.com/photo-1484723091739-30990ca3bc79?w=800'],
    video:'', tags:['breakfast','french toast','sweet','quick'] }),

  // ══ BRUNCH ═════════════════════════════════════════════════
  r({ title:'Chole Bhature', meal_type:'Brunch', category:'Street Food', cuisine:'Indian', prep_time:30, cook_time:40, servings:4, difficulty:'Medium', featured:1, rating:4.8,
    description:'Delhi\'s most iconic street food — spiced chickpea curry with giant, puffed deep-fried bread.',
    ingredients:['2 cans chickpeas','3 onions','4 tomatoes','2 tbsp chole masala','1 tsp amchur','1 tbsp ginger-garlic paste','2 cups flour (bhature)','1/2 cup yogurt','1 tsp baking soda'],
    steps:['Make bhature dough with flour, yogurt, baking soda. Rest 2 hrs.','Sauté onions dark. Add ginger-garlic, tomatoes, chole masala.','Add chickpeas + water. Simmer 25 mins.','Roll bhature into ovals. Deep fry until puffed.','Serve hot with sliced onion, pickle, green chili.'],
    images:['https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800'],
    video:'https://www.youtube.com/embed/K9cMCpRcJxg', tags:['indian','street food','chickpeas','delhi'] }),

  r({ title:'Pav Bhaji', meal_type:'Brunch', category:'Street Food', cuisine:'Indian', prep_time:20, cook_time:30, servings:6, difficulty:'Easy', featured:1, rating:4.9,
    description:'Mumbai\'s most iconic street food — a spiced, buttery vegetable mash served with toasted pav buns.',
    ingredients:['3 potatoes boiled','1 cup peas boiled','2 capsicums diced','3 tomatoes chopped','2 onions finely chopped','100g butter','3 tbsp pav bhaji masala','8 pav buns'],
    steps:['Boil and mash potatoes and peas coarsely.','Cook capsicum and tomatoes in butter until soft.','Add onions, pav bhaji masala. Mix and mash everything.','Cook 15 mins, adding butter, mashing regularly.','Toast pav with butter. Serve with bhaji, onion, coriander, lemon.'],
    images:['https://images.unsplash.com/photo-1600803907087-f56d462fd26b?w=800'],
    video:'', tags:['indian','mumbai','street food','vegetarian','butter'] }),

  r({ title:'Eggs Benedict', meal_type:'Brunch', category:'Breakfast', cuisine:'American', prep_time:20, cook_time:20, servings:2, difficulty:'Hard', rating:4.6,
    description:'The quintessential brunch dish — toasted English muffin with Canadian bacon, a silky poached egg, and velvety hollandaise sauce.',
    ingredients:['4 eggs (2 for poaching, 2 yolks for hollandaise)','2 English muffins','4 slices Canadian bacon or ham','200g butter clarified','2 tbsp lemon juice','White wine vinegar','Cayenne pepper','Chives'],
    steps:['Make hollandaise: whisk yolks and lemon over double boiler until thick. Slowly drizzle warm butter. Season.','Pan-fry Canadian bacon until lightly browned.','Toast English muffins.','Poach eggs 3-4 minutes in simmering vinegar water.','Assemble: muffin, bacon, egg. Spoon hollandaise. Top with chives.'],
    images:['https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800'],
    video:'', tags:['brunch','eggs','hollandaise','american','classic'] }),

  // ══ LUNCH ══════════════════════════════════════════════════
  r({ title:'Classic Caesar Salad', meal_type:'Lunch', category:'Salad', cuisine:'American', prep_time:20, cook_time:10, servings:4, difficulty:'Easy', featured:1, rating:4.7,
    description:'Crisp romaine, house-made Caesar dressing, sourdough croutons, and shaved Parmesan. Bold, briny, and totally addictive.',
    ingredients:['2 romaine hearts','100g Parmesan shaved','3 anchovy fillets','2 egg yolks','2 garlic cloves','1 tbsp Dijon','2 tbsp lemon juice','50ml olive oil','2 cups sourdough cubes'],
    steps:['Bake sourdough cubes with olive oil and garlic at 200°C until golden.','Blend anchovies, yolks, garlic, Dijon, lemon for dressing. Whisk in oil.','Tear romaine into large pieces.','Toss with dressing just before serving.','Top with croutons, shaved Parmesan, black pepper.'],
    images:['https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800'],
    video:'https://www.youtube.com/embed/B0HM3OOOROQ', tags:['salad','caesar','american','lunch'] }),

  r({ title:'Greek Salad (Horiatiki)', meal_type:'Lunch', category:'Salad', cuisine:'Greek', prep_time:15, cook_time:0, servings:4, difficulty:'Easy', featured:1, rating:4.8,
    description:'Ripe tomatoes, cucumbers, Kalamata olives, and a thick slab of briny feta drizzled with the finest olive oil.',
    ingredients:['4 large tomatoes chunked','1 cucumber chunked','1 red onion sliced','200g feta cheese','1 cup Kalamata olives','1 green bell pepper sliced','4 tbsp extra virgin olive oil','1 tsp dried oregano'],
    steps:['Chunk all vegetables roughly.','Arrange tomatoes, cucumber, onion, pepper.','Add olives.','Place feta block on top.','Drizzle olive oil. Season with oregano, salt, pepper.'],
    images:['https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800'],
    video:'', tags:['salad','greek','feta','mediterranean'] }),

  r({ title:'Quinoa Power Bowl', meal_type:'Lunch', category:'Salad', cuisine:'American', prep_time:20, cook_time:30, servings:4, difficulty:'Easy', featured:1, rating:4.7,
    description:'A nutrition powerhouse — fluffy quinoa with roasted sweet potato, chickpeas, avocado, kale, and tahini dressing.',
    ingredients:['1.5 cups quinoa','2 sweet potatoes cubed','1 can chickpeas','4 cups kale massaged','2 avocados','3 tbsp tahini','2 tbsp lemon','1 garlic clove','Pumpkin seeds','Za\'atar'],
    steps:['Cook quinoa. Fluff and cool.','Roast sweet potato and chickpeas at 200°C 30 min.','Massage kale with olive oil and lemon.','Make tahini dressing.','Build bowls: quinoa, kale, veg, avocado. Drizzle dressing.'],
    images:['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'],
    video:'', tags:['salad','quinoa','healthy','vegan','bowl'] }),

  r({ title:'Hyderabadi Dum Biryani', meal_type:'Lunch', category:'Rice', cuisine:'Indian', prep_time:60, cook_time:60, servings:6, difficulty:'Hard', featured:1, rating:5.0,
    description:'Fragrant basmati layered with spiced mutton, saffron, caramelized onions, sealed and slow-cooked on dum.',
    ingredients:['1kg mutton','3 cups basmati rice','3 onions thinly sliced','1 cup yogurt','3 tbsp biryani masala','1/2 tsp saffron in warm milk','4 tbsp ghee','2 tbsp ginger-garlic paste','Whole spices: bay leaf, cardamom, cloves','Fresh mint and coriander'],
    steps:['Fry onions until crispy. Set aside half.','Marinate mutton in yogurt, masala, ginger-garlic, half fried onions.','Par-cook rice with whole spices to 70%.','Layer: rice, mutton, mint, fried onions, saffron milk, ghee.','Seal pot. Dum cook 45 min on low heat. Rest 10 min before serving.'],
    images:['https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800'],
    video:'https://www.youtube.com/embed/6n6PJQ5vNps', tags:['indian','biryani','rice','hyderabadi','mutton'] }),

  r({ title:'Tabbouleh', meal_type:'Lunch', category:'Salad', cuisine:'Lebanese', prep_time:30, cook_time:0, servings:6, difficulty:'Easy', rating:4.7,
    description:'Lebanon\'s national salad — herb-forward explosion of parsley, mint, bulgur, tomatoes and lemon.',
    ingredients:['3 bunches flat-leaf parsley finely chopped','1/2 cup fine bulgur','1 bunch fresh mint','4 tomatoes finely diced','2 spring onions','1 cucumber diced','4 tbsp lemon juice','4 tbsp olive oil'],
    steps:['Soak bulgur in cold water 20 min. Drain, squeeze dry.','Finely chop parsley and mint.','Dice tomatoes, cucumber, spring onions.','Combine all.','Dress with lemon and olive oil. Season. Rest 15 min.'],
    images:['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'],
    video:'', tags:['salad','lebanese','parsley','middle eastern'] }),

  r({ title:'Watermelon Feta Salad', meal_type:'Lunch', category:'Salad', cuisine:'Mediterranean', prep_time:15, cook_time:0, servings:6, difficulty:'Easy', featured:1, rating:4.8,
    description:'Sweet juicy watermelon with salty feta, fresh mint, cucumber and lime dressing. Impossibly refreshing.',
    ingredients:['1/2 watermelon cubed','200g feta crumbled','1 cucumber diced','1/2 red onion thinly sliced','1/2 cup fresh mint','2 tbsp lime juice','2 tbsp olive oil','Chili flakes','Flaky salt'],
    steps:['Cube watermelon. Dice cucumber. Slice red onion thin.','Arrange in shallow bowl.','Scatter feta, red onion, mint.','Whisk lime juice, olive oil, chili.','Drizzle dressing. Add flaky salt.'],
    images:['https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800'],
    video:'', tags:['salad','watermelon','feta','summer','refreshing'] }),

  r({ title:'Nicoise Salad', meal_type:'Lunch', category:'Salad', cuisine:'French', prep_time:25, cook_time:15, servings:4, difficulty:'Medium', rating:4.6,
    description:'Elegant Provençal salad with tuna, soft-boiled eggs, haricots verts and Nicoise olives in herby mustard vinaigrette.',
    ingredients:['200g tuna','4 eggs','200g green beans','200g baby potatoes','150g cherry tomatoes','1 cup Nicoise olives','Lettuce','2 tsp Dijon','3 tbsp red wine vinegar','6 tbsp olive oil'],
    steps:['Soft-boil eggs 6.5 min. Blanch green beans. Cook potatoes.','Arrange lettuce as base.','Compose all ingredients in sections.','Whisk vinaigrette.','Drizzle over salad. Season.'],
    images:['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'],
    video:'', tags:['salad','french','tuna','nicoise'] }),

  // ══ DINNER ═════════════════════════════════════════════════
  r({ title:'Classic Pasta Carbonara', meal_type:'Dinner', category:'Pasta', cuisine:'Italian', prep_time:15, cook_time:20, servings:4, difficulty:'Medium', featured:1, rating:4.8,
    description:'Rich and creamy Italian pasta made with eggs, hard cheese, cured pork and black pepper. No cream needed.',
    ingredients:['400g spaghetti','200g pancetta or guanciale','4 large eggs','100g Pecorino Romano grated','50g Parmesan grated','4 garlic cloves','Freshly ground black pepper','Salt'],
    steps:['Boil spaghetti until al dente.','Fry pancetta until crispy. Add minced garlic.','Whisk eggs with grated cheeses and black pepper.','Reserve 1 cup pasta water. Drain.','Off heat: add pasta to skillet, add egg mixture, toss vigorously. Add pasta water for creaminess.'],
    images:['https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800'],
    video:'https://www.youtube.com/embed/3AAdKl1UYZs', tags:['pasta','italian','dinner','quick','comfort'] }),

  r({ title:'Butter Chicken (Murgh Makhani)', meal_type:'Dinner', category:'Curry', cuisine:'Indian', prep_time:30, cook_time:45, servings:6, difficulty:'Medium', featured:1, rating:4.9,
    description:'The iconic North Indian curry with tender chicken in a velvety tomato-butter sauce. The world\'s most loved curry.',
    ingredients:['1kg chicken thighs','200ml yogurt','2 tbsp lemon juice','2 tsp cumin','400ml tomato purée','200ml heavy cream','100g butter','2 onions','4 garlic cloves','1 tbsp ginger paste','2 tsp garam masala','1 tsp turmeric'],
    steps:['Marinate chicken in yogurt, lemon, cumin, salt for 2 hrs.','Grill or pan-fry chicken until charred.','Sauté onions in butter until golden. Add garlic, ginger.','Add tomatoes and spices. Simmer 20 min.','Blend sauce smooth. Add cream and butter.','Add chicken. Simmer 10 min. Garnish with cream.'],
    images:['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800'],
    video:'https://www.youtube.com/embed/a03U45jFxOI', tags:['indian','curry','chicken','butter chicken'] }),

  r({ title:'Dal Makhani', meal_type:'Dinner', category:'Dal', cuisine:'Indian', prep_time:20, cook_time:180, servings:6, difficulty:'Medium', featured:1, rating:4.9,
    description:'The crown jewel of Punjabi cuisine — slow-cooked black lentils simmered with butter and cream. Smoky and indulgent.',
    ingredients:['250g whole urad dal','50g kidney beans','100g butter','100ml cream','2 onions','4 tomatoes pureed','2 tbsp ginger-garlic paste','2 tsp cumin','1 tsp turmeric','2 tsp garam masala'],
    steps:['Soak lentils overnight. Pressure cook 45 min.','Sauté onions in butter until deep brown.','Add ginger-garlic, tomatoes, spices. Cook 20 min.','Add lentils. Simmer 2-3 hrs on low heat.','Stir in butter and cream before serving.'],
    images:['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800'],
    video:'https://www.youtube.com/embed/cTXs2ARfxts', tags:['indian','lentils','vegetarian','punjabi','comfort'] }),

  r({ title:'Palak Paneer', meal_type:'Dinner', category:'Curry', cuisine:'Indian', prep_time:20, cook_time:30, servings:4, difficulty:'Easy', rating:4.7,
    description:'Creamy spinach gravy with soft paneer cubes — vibrant, nutritious, and pairs perfectly with naan.',
    ingredients:['400g fresh spinach','300g paneer cubed','2 onions','3 tomatoes','2 tbsp ginger-garlic paste','100ml cream','2 tsp cumin','1 tsp turmeric','2 tsp coriander powder','1 tsp garam masala','2 green chilies'],
    steps:['Blanch spinach 2 min. Cool. Blend smooth.','Sauté onions golden. Add ginger-garlic, tomatoes, spices.','Cook until oil separates.','Add spinach puree. Simmer 10 min.','Add pan-fried paneer and cream. Cook 5 min.'],
    images:['https://images.unsplash.com/photo-1600783245777-080fd7ff9253?w=800'],
    video:'https://www.youtube.com/embed/gLNMiSwkFXk', tags:['indian','palak','paneer','vegetarian'] }),

  r({ title:'Rogan Josh', meal_type:'Dinner', category:'Curry', cuisine:'Indian', prep_time:30, cook_time:90, servings:5, difficulty:'Hard', rating:4.8,
    description:'The prized Kashmiri lamb curry — slow-cooked mutton in a deep-red, warming spiced gravy. A royal dish.',
    ingredients:['1kg lamb bone-in','3 onions','1 cup yogurt','3 tbsp Kashmiri chili powder','2 tsp coriander powder','1 tsp ginger powder','1 tsp fennel powder','4 tbsp mustard oil','Whole spices: bay leaf, black cardamom, cinnamon'],
    steps:['Brown onions in mustard oil until deep red.','Fry whole spices. Add lamb and brown all sides.','Add yogurt gradually. Add all ground spices.','Add water. Slow cook covered 60-75 min.','Finish with fried onions. Serve with naan.'],
    images:['https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=800'],
    video:'', tags:['indian','kashmiri','lamb','curry','slow cook'] }),

  r({ title:'Tom Yum Goong Soup', meal_type:'Dinner', category:'Soup', cuisine:'Thai', prep_time:20, cook_time:20, servings:4, difficulty:'Medium', rating:4.7,
    description:'Thailand\'s most beloved soup — bold, spicy, sour, and aromatic. Loaded with plump shrimp and lemongrass.',
    ingredients:['500g tiger prawns','1L chicken stock','3 stalks lemongrass','5 slices galangal','6 kaffir lime leaves','200g mushrooms','3 tbsp fish sauce','3 tbsp lime juice','2 tbsp chili paste','4 bird\'s eye chilies','Fresh cilantro'],
    steps:['Bruise lemongrass, pound galangal, tear lime leaves.','Bring stock to boil. Add aromatics. Simmer 5 min.','Add mushrooms, cook 3 min.','Add prawns, cook 2-3 min.','Season with fish sauce, lime, chili paste.','Serve with cilantro and fresh chilies.'],
    images:['https://images.unsplash.com/photo-1569000124341-a7f2b06aa12a?w=800'],
    video:'', tags:['soup','thai','spicy','seafood','dinner'] }),

  r({ title:'Paneer Tikka Masala', meal_type:'Dinner', category:'Curry', cuisine:'Indian', prep_time:30, cook_time:35, servings:4, difficulty:'Medium', featured:1, rating:4.9,
    description:'Smoky charred paneer in a velvety spiced tomato-cream gravy. The ultimate vegetarian Indian curry.',
    ingredients:['500g paneer cubed','200ml yogurt','2 tbsp tandoori masala','3 tomatoes pureed','2 onions','200ml cream','2 tbsp ginger-garlic paste','2 tsp garam masala','1 tsp kasuri methi','2 tsp Kashmiri chili'],
    steps:['Marinate paneer in yogurt, tandoori masala, chili for 2 hrs.','Grill paneer until charred.','Sauté onions. Add ginger-garlic, tomatoes, spices. Cook 15 min.','Add cream, kasuri methi, grilled paneer.','Simmer 5 min. Garnish with coriander.'],
    images:['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800'],
    video:'', tags:['indian','paneer','vegetarian','curry'] }),

  r({ title:'Kerala Fish Curry', meal_type:'Dinner', category:'Seafood', cuisine:'Indian', prep_time:20, cook_time:25, servings:4, difficulty:'Medium', rating:4.8,
    description:'Fiery, tangy coconut-based fish curry from God\'s Own Country. Made with kokum and coconut milk — pure coastal magic.',
    ingredients:['700g firm fish','400ml coconut milk','3 tbsp coconut oil','2 onions sliced','3 tomatoes','2 tbsp ginger sliced','10 green chilies slit','1 tbsp Kashmiri chili','1 tsp turmeric','Curry leaves','Kokum or tamarind'],
    steps:['Heat coconut oil. Sauté ginger, green chilies, curry leaves.','Add onions until soft.','Add tomatoes, chili, turmeric. Cook 10 min.','Add coconut milk and kokum. Bring to simmer.','Add fish. Cook covered 10-12 min. Shake pot instead of stirring.'],
    images:['https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800'],
    video:'', tags:['indian','kerala','fish','seafood','coconut','spicy'] }),

  r({ title:'Rajma Chawal', meal_type:'Dinner', category:'Dal', cuisine:'Indian', prep_time:20, cook_time:60, servings:4, difficulty:'Easy', rating:4.7,
    description:'North India\'s ultimate comfort food — kidney beans in thick onion-tomato gravy, served over fluffy steamed rice.',
    ingredients:['2 cups kidney beans soaked','3 onions finely chopped','4 tomatoes pureed','2 tbsp ginger-garlic paste','2 tsp cumin seeds','2 tsp coriander powder','1 tsp turmeric','2 tsp rajma masala','2 cups basmati rice'],
    steps:['Soak rajma overnight. Pressure cook 20-25 min.','Sauté onions in ghee until golden.','Add ginger-garlic, tomatoes, spices. Cook 15 min.','Add rajma with water. Simmer 25 min. Mash a few beans.','Serve over steamed rice with onion and pickle.'],
    images:['https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800'],
    video:'', tags:['indian','rajma','kidney beans','rice','vegetarian'] }),

  r({ title:'Chicken Korma', meal_type:'Dinner', category:'Curry', cuisine:'Indian', prep_time:30, cook_time:50, servings:5, difficulty:'Medium', rating:4.7,
    description:'A Mughal royal curry — tender chicken slow-braised in yogurt, cashew paste, saffron, and aromatic spices. Mild and magnificent.',
    ingredients:['1kg chicken','3 onions fried golden','1 cup yogurt','50g cashew nuts','1/2 tsp saffron in warm milk','3 tbsp ghee','2 tbsp ginger-garlic paste','Whole spices: cardamom, cloves, cinnamon','1 tsp white pepper','200ml cream'],
    steps:['Blend fried onions to smooth paste.','Sauté whole spices in ghee. Add onion paste.','Add chicken, ginger-garlic. Cook 10 min.','Add yogurt and cashew paste. Mix well.','Add saffron milk. Cook covered 30 min.','Finish with cream. Serve with naan.'],
    images:['https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=800'],
    video:'', tags:['indian','mughlai','chicken','curry','mild','creamy'] }),

  r({ title:'Classic Beef Tacos', meal_type:'Dinner', category:'Mexican', cuisine:'Mexican', prep_time:20, cook_time:15, servings:4, difficulty:'Easy', rating:4.6,
    description:'Juicy seasoned ground beef in crispy corn tortillas with fresh salsa, lime crema, and crunchy cabbage. Street food perfection.',
    ingredients:['500g ground beef','8 corn tortillas','1 onion diced','3 garlic cloves','2 tsp cumin','2 tsp chili powder','1 tsp smoked paprika','2 tomatoes diced','Shredded cabbage','Lime crema','Cilantro','Lime wedges'],
    steps:['Cook onion and garlic until softened.','Add beef, break apart, brown.','Add spices. Cook 2 more min.','Warm tortillas over flame.','Make quick salsa. Assemble tacos.'],
    images:['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800'],
    video:'https://www.youtube.com/embed/H3JpSjqSAqM', tags:['mexican','tacos','quick','beef'] }),

  r({ title:'Matar Paneer', meal_type:'Dinner', category:'Curry', cuisine:'Indian', prep_time:15, cook_time:25, servings:4, difficulty:'Easy', rating:4.5,
    description:'Classic North Indian curry of green peas and paneer in a lightly spiced onion-tomato gravy. Comforting and quick.',
    ingredients:['300g paneer cubed','1 cup green peas','3 tomatoes pureed','2 onions','2 tbsp ginger-garlic paste','1 tsp cumin seeds','1 tsp turmeric','2 tsp coriander powder','1 tsp garam masala','2 tbsp cream'],
    steps:['Sauté onions golden. Add ginger-garlic, tomatoes, spices. Cook 12 min.','Add peas. Cook 5 min.','Add paneer and cream. Simmer 5 min.','Serve with roti.'],
    images:['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800'],
    video:'', tags:['indian','paneer','peas','vegetarian'] }),

  // ══ SNACKS ══════════════════════════════════════════════════
  r({ title:'Samosa (Punjabi)', meal_type:'Snack', category:'Snacks', cuisine:'Indian', prep_time:40, cook_time:20, servings:16, difficulty:'Medium', rating:4.7,
    description:'Crispy golden triangles stuffed with spiced potato and peas. The world\'s most beloved Indian snack.',
    ingredients:['2 cups all-purpose flour','1/2 cup ghee','4 potatoes boiled','1 cup peas','2 tsp cumin seeds','2 tsp coriander powder','1 tsp amchur','1 tsp garam masala','2 green chilies','Oil for deep frying'],
    steps:['Make stiff dough with flour, ghee, salt. Rest 30 min.','Mash potatoes with spices, peas, chili.','Roll dough into ovals, cut in half. Form cones. Fill. Seal.','Deep fry on medium heat until golden brown.','Serve with mint and tamarind chutney.'],
    images:['https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800'],
    video:'https://www.youtube.com/embed/b8kbFZiaTgE', tags:['indian','snack','fried','potato','tea time'] }),

  r({ title:'Pani Puri (Golgappa)', meal_type:'Snack', category:'Street Food', cuisine:'Indian', prep_time:45, cook_time:20, servings:6, difficulty:'Medium', featured:1, rating:4.9,
    description:'India\'s most popular street food — hollow crispy puris filled with spiced potato and drowned in tangy mint water.',
    ingredients:['1 cup semolina','3 tbsp all-purpose flour','2 potatoes boiled','1/2 cup boiled chickpeas','Mint, coriander, tamarind paste','Ginger, green chili, black salt, cumin','Chaat masala'],
    steps:['Mix semolina and flour to stiff dough. Rest 30 min.','Roll very thin. Cut into small circles. Deep fry until puffed.','Mash potatoes with chickpeas, chaat masala, cumin.','Blend mint, coriander, ginger, chili, tamarind for spiced water. Chill.','Crack puri, fill with potato mix, dip in pani.'],
    images:['https://images.unsplash.com/photo-1607301405390-d831c242f59e?w=800'],
    video:'https://www.youtube.com/embed/3t6TkEgIDmg', tags:['indian','street food','chaat','snack'] }),

  r({ title:'Chicken Tikka', meal_type:'Snack', category:'Grill', cuisine:'Indian', prep_time:120, cook_time:20, servings:4, difficulty:'Easy', featured:1, rating:4.8,
    description:'Succulent chunks of chicken marinated in spiced yogurt and grilled to perfection. India\'s favourite starter.',
    ingredients:['800g boneless chicken','1 cup yogurt','2 tbsp ginger-garlic paste','2 tsp tikka masala','1 tsp Kashmiri chili','1 tbsp lemon juice','1 tsp cumin','1/2 tsp turmeric','Bell peppers and onions'],
    steps:['Cut chicken into chunks. Score with knife.','Mix yogurt with all spices. Coat chicken. Marinate 2-4 hrs.','Thread on skewers with peppers and onions.','Grill or bake at 220°C for 18-20 min.','Baste with butter. Serve with mint chutney.'],
    images:['https://images.unsplash.com/photo-1562802378-063ec186a863?w=800'],
    video:'', tags:['indian','chicken','grill','starter','tikka'] }),

  r({ title:'Tandoori Chicken', meal_type:'Snack', category:'Grill', cuisine:'Indian', prep_time:240, cook_time:30, servings:4, difficulty:'Medium', featured:1, rating:4.9,
    description:'The iconic char-grilled chicken from the clay oven — marinated in yogurt and vibrant spices, producing smoky, juicy perfection.',
    ingredients:['1.5kg chicken cut in pieces','1 cup thick yogurt','3 tbsp tandoori masala','2 tbsp ginger-garlic paste','2 tbsp Kashmiri red chili','2 tbsp lemon juice','1 tsp garam masala','2 tbsp mustard oil'],
    steps:['Score chicken deeply. First marinade: salt and lemon. Rest 30 min.','Mix yogurt with all spices for second marinade. Coat chicken.','Marinate 4-6 hrs (overnight preferred).','Cook in very hot oven (220°C) or grill 25-30 min.','Baste with butter halfway. Serve with sliced onions, lemon.'],
    images:['https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800'],
    video:'', tags:['indian','chicken','grill','tandoor'] }),

  // ══ DESSERTS ════════════════════════════════════════════════
  r({ title:'Chocolate Lava Cake', meal_type:'Dessert', category:'Dessert', cuisine:'French', prep_time:15, cook_time:12, servings:4, difficulty:'Medium', featured:1, rating:4.9,
    description:'The ultimate indulgent dessert — warm chocolate cake with a molten flowing center. Deceptively simple yet incredibly impressive.',
    ingredients:['200g dark chocolate (70%)','200g unsalted butter','4 eggs + 4 egg yolks','200g powdered sugar','80g all-purpose flour','1 tsp vanilla','Cocoa powder for dusting','Vanilla ice cream'],
    steps:['Preheat oven 220°C. Butter and dust 4 ramekins.','Melt chocolate and butter together.','Whisk eggs, yolks, sugar until pale. Add vanilla.','Fold chocolate into egg mixture. Fold in flour.','Pour into ramekins. Refrigerate up to 24 hrs.','Bake 10-12 min. Invert onto plate. Serve with ice cream.'],
    images:['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800'],
    video:'https://www.youtube.com/embed/8-JnBGm1kH4', tags:['dessert','chocolate','french','baking','lava'] }),

  r({ title:'Gulab Jamun', meal_type:'Dessert', category:'Dessert', cuisine:'Indian', prep_time:20, cook_time:30, servings:20, difficulty:'Medium', rating:4.8,
    description:'Soft spongy milk-solid dumplings soaked in cardamom and rose sugar syrup. India\'s most beloved dessert.',
    ingredients:['1 cup khoya/mawa','3 tbsp all-purpose flour','1/4 tsp baking soda','1 tbsp ghee','Milk to knead','2 cups sugar + 1 cup water (for syrup)','1 tsp cardamom','1 tbsp rose water'],
    steps:['Make sugar syrup with cardamom and rose water. Keep warm.','Mix khoya, flour, baking soda, ghee. Knead with milk to soft dough.','Roll into smooth balls.','Deep fry on low heat until deep golden brown.','Drop hot jamuns into warm syrup. Soak 2 hrs.'],
    images:['https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800'],
    video:'', tags:['indian','dessert','sweet','milk','festive'] }),

  r({ title:'Ras Malai', meal_type:'Dessert', category:'Dessert', cuisine:'Indian', prep_time:30, cook_time:60, servings:12, difficulty:'Hard', featured:1, rating:4.9,
    description:'Pillowy soft cheese dumplings floating in chilled saffron-laced thickened milk. The queen of Indian sweets.',
    ingredients:['2 litres full-fat milk','3 tbsp lemon juice','1 cup sugar','1/2 tsp saffron','1 tsp cardamom','Rose water','Pistachios and almonds slivered'],
    steps:['Boil 1L milk. Curdle with lemon. Strain through muslin.','Knead chenna smooth. Shape into flat discs.','Boil sugar syrup. Cook chenna discs 15 min.','Reduce remaining milk to half for rabri. Add sugar, saffron, cardamom.','Squeeze discs. Add to chilled rabri. Refrigerate 2 hrs.'],
    images:['https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800'],
    video:'', tags:['indian','dessert','sweet','milk','bengali'] }),

  r({ title:'Kheer (Rice Pudding)', meal_type:'Dessert', category:'Dessert', cuisine:'Indian', prep_time:10, cook_time:60, servings:6, difficulty:'Easy', rating:4.7,
    description:'India\'s timeless rice pudding — basmati rice slow-cooked in full-fat milk with cardamom, saffron and nuts until rich and fragrant.',
    ingredients:['1/4 cup basmati rice','1 litre full-fat milk','1/2 cup sugar','1/2 tsp cardamom powder','Pinch of saffron','2 tbsp rose water','Cashews, almonds, pistachios','Raisins'],
    steps:['Wash and soak rice 30 min.','Boil milk in heavy pot. Add rice.','Simmer on low heat 40-50 min, stirring often.','Add sugar, cardamom, saffron when thickened.','Add rose water. Garnish with nuts and raisins. Serve warm or chilled.'],
    images:['https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800'],
    video:'', tags:['indian','dessert','rice pudding','kheer','festive'] }),
];

async function seed(){
  let conn;
  try {
    conn = await mysql.createConnection(DB_CFG);
    console.log('✅ Connected to MySQL');

    // Clear existing data
    await conn.execute('SET FOREIGN_KEY_CHECKS=0');
    await conn.execute('TRUNCATE TABLE meal_plan_items');
    await conn.execute('TRUNCATE TABLE meal_plans');
    await conn.execute('TRUNCATE TABLE favorites');
    await conn.execute('TRUNCATE TABLE recipes');
    await conn.execute('TRUNCATE TABLE users');
    await conn.execute('SET FOREIGN_KEY_CHECKS=1');

    // Users
    const adminId = uuidv4(), userId = uuidv4();
    await conn.execute(
      'INSERT INTO users (id,username,email,password,role) VALUES (?,?,?,?,?)',
      [adminId,'admin','admin@smartrecipe.com', bcrypt.hashSync('admin123',10),'admin']
    );
    await conn.execute(
      'INSERT INTO users (id,username,email,password,role) VALUES (?,?,?,?,?)',
      [userId,'foodlover','foodlover@example.com', bcrypt.hashSync('food123',10),'user']
    );
    console.log('✅ Users seeded');

    // Recipes
    const recipeSQL = `INSERT INTO recipes
      (id,title,description,category,meal_type,cuisine,prep_time,cook_time,servings,
       difficulty,ingredients,steps,images,video,tags,featured,rating)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    for(const rec of RECIPES){
      await conn.execute(recipeSQL,[
        rec.id, rec.title, rec.description, rec.category, rec.meal_type,
        rec.cuisine, rec.prep_time, rec.cook_time, rec.servings, rec.difficulty,
        JSON.stringify(rec.ingredients), JSON.stringify(rec.steps),
        JSON.stringify(rec.images), rec.video||'',
        JSON.stringify(rec.tags), rec.featured?1:0, rec.rating
      ]);
    }
    console.log(`✅ ${RECIPES.length} recipes seeded`);

    // Sample favorites
    await conn.execute(
      'INSERT INTO favorites (user_id,recipe_id) VALUES (?,?)',
      [userId, RECIPES[0].id]
    );
    await conn.execute(
      'INSERT INTO favorites (user_id,recipe_id) VALUES (?,?)',
      [userId, RECIPES[3].id]
    );
    console.log('✅ Favorites seeded');
    console.log('\n🎉 Seed complete!');
    console.log('   Admin: admin / admin123');
    console.log('   User:  foodlover / food123\n');
  } catch(e){
    console.error('❌ Seed error:', e.message);
  } finally {
    if(conn) await conn.end();
    process.exit(0);
  }
}

seed();
