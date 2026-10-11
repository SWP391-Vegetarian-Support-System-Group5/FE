export type BilingualText = readonly [english: string, vietnamese: string];

export interface DetailRecipe {
  slug: string;
  title: BilingualText;
  subtitle: string;
  category: BilingualText;
  author: string;
  image: string;
  duration: string;
  prep: number;
  cook: number;
  servings: string;
  rating: number;
  ratingCount: number;
  commentCount: number;
  about: BilingualText;
  ingredients: { name: BilingualText; amount: BilingualText }[];
  steps: { title: BilingualText; instruction: BilingualText; time: string }[];
  tip: BilingualText;
  pairing: BilingualText;
  season: { title: BilingualText; text: BilingualText };
  comments: { id: string; name: string; initials: string; text: BilingualText; date: BilingualText; reply?: BilingualText }[];
}

// Design fixtures only. No API calls or server mutations are made by this page.
export const detailRecipes: DetailRecipe[] = [
  {
    slug: "tofu-tomato", title: ["Easy Tofu in Tomato Sauce", "Đậu hũ sốt cà chua"], subtitle: "Đậu Hũ Sốt Cà Chua",
    category: ["VIETNAMESE HERITAGE COOKING", "ẨM THỰC TRUYỀN THỐNG VIỆT NAM"], author: "Minh Tran", image: "/images/recipe_tofu_tomato.png", duration: "05:42", prep: 10, cook: 15, servings: "2–3", rating: 4.6, ratingCount: 5, commentCount: 38,
    about: ["A beloved Vietnamese comfort food staple made with golden pan-fried tofu simmered in a luscious sweet-savory fresh tomato sauce with scallions. Quick, high-protein, and deeply satisfying with warm jasmine rice.", "Món ăn quen thuộc trong bữa cơm Việt: đậu hũ chiên vàng, rim trong sốt cà chua tươi ngọt dịu cùng hành lá. Dễ làm, giàu đạm thực vật và ngon hơn khi dùng với cơm nóng."],
    ingredients: [
      { name: ["Firm organic tofu", "Đậu hũ hữu cơ"], amount: ["400 g · cubed & patted dry", "400 g · cắt vuông, thấm khô"] },
      { name: ["Ripe plum tomatoes", "Cà chua chín"], amount: ["4 · finely diced", "4 quả · thái hạt lựu"] },
      { name: ["Fresh scallions", "Hành lá"], amount: ["2 stalks · whites minced, greens sliced", "2 nhánh · băm đầu trắng, thái phần xanh"] },
      { name: ["Vegetarian mushroom soy sauce", "Nước tương nấm chay"], amount: ["1 tbsp · plant-derived", "1 thìa canh · nguồn gốc thực vật"] },
      { name: ["Sea salt & cane sugar", "Muối biển & đường mía"], amount: ["1 tsp · adjust to taste", "1 thìa cà phê · nêm theo khẩu vị"] },
      { name: ["Neutral cooking oil", "Dầu thực vật"], amount: ["2 tbsp", "2 thìa canh"] },
    ],
    steps: [
      { title: ["Pan-Searing Foundation", "Áp chảo đậu hũ"], time: "00:24", instruction: ["Cut tofu into bite-sized cubes. Pan-sear in 2 tbsp oil over medium heat until all sides are golden and slightly crisp (about 6–8 minutes). Set aside.", "Cắt đậu hũ thành miếng vừa ăn. Áp chảo với 2 thìa dầu ở lửa vừa khoảng 6–8 phút, đến khi các mặt vàng giòn nhẹ. Gắp ra để riêng."] },
      { title: ["Tomato Reduction", "Làm sốt cà chua"], time: "01:15", instruction: ["In the same pan, sauté minced scallion whites until fragrant. Add diced tomatoes, salt and sugar. Simmer covered on low heat for 5 minutes until the tomatoes break down into a rich sauce.", "Phi thơm đầu hành trong chảo. Cho cà chua, muối và đường vào. Đậy nắp, đun nhỏ lửa khoảng 5 phút để cà chua mềm và tạo thành sốt sánh."] },
      { title: ["Simmer & Presentation", "Rim đậu hũ và trình bày"], time: "02:40", instruction: ["Gently fold the seared tofu into the sauce. Simmer for 3–4 minutes so it absorbs the flavor. Garnish with scallion greens and serve hot with fragrant jasmine rice.", "Cho đậu hũ vào sốt, đảo nhẹ và rim 3–4 phút cho thấm vị. Rắc hành lá và dùng nóng với cơm trắng."] },
    ],
    tip: ["Ripe vine tomatoes release natural glutamates when reduced slowly. Never rush the tomato breakdown—letting them collapse over low heat forms a natural glaze without a heavy cornstarch slurry.", "Cà chua chín tạo vị ngọt đậm đà khi nấu chậm. Hãy để cà chua mềm dần ở lửa nhỏ để có lớp sốt sánh tự nhiên mà không cần nhiều bột làm đặc."],
    pairing: ["Jasmine rice or fresh, crusty bánh mì", "Cơm trắng hoặc bánh mì giòn"],
    season: { title: ["Late Summer Heirloom Tomatoes", "Cà chua chín cuối mùa hè"], text: ["Plum and beefsteak tomatoes bring natural sweetness and a bright acidity to this simple sauce. Choose ripe, fragrant fruit for the best flavor.", "Cà chua chín mang đến vị ngọt tự nhiên và chút chua thanh cho sốt. Chọn quả chín đều, thơm để món ăn ngon hơn."] },
    comments: [
      { id: "tofu-1", name: "Mai Linh", initials: "ML", date: ["1 day ago", "1 ngày trước"], text: ["This looks delicious! Can I substitute firm tofu with pressed silken tofu?", "Nhìn ngon quá! Mình có thể thay đậu hũ chắc bằng đậu hũ non đã ép ráo không?"], reply: ["Yes, Mai Linh! Pan-fry it gently over medium heat with a light cornstarch dusting so it keeps its tender shape.", "Được nhé Mai Linh! Bạn áp chảo nhẹ ở lửa vừa và áo chút bột bắp để đậu hũ giữ được hình dáng."] },
      { id: "tofu-2", name: "David Tran", initials: "DT", date: ["2 days ago", "2 ngày trước"], text: ["I tried this recipe yesterday for dinner. The whole family loved the sauce balance! Simmering the scallion whites early makes a lovely difference.", "Mình đã nấu món này tối qua, cả nhà rất thích vị sốt! Phi đầu hành trước giúp món ăn thơm hơn hẳn."] },
    ],
  },
  {
    slug: "bun-chay-hue", title: ["Bún Chay Huế — Spicy Lemongrass Broth", "Bún chay Huế — đậm vị sả"], subtitle: "Bún Chay Huế", category: ["CENTRAL VIETNAMESE KITCHEN", "HƯƠNG VỊ MIỀN TRUNG"], author: "Lan Nguyen", image: "/images/my-content-noodles.jpg", duration: "06:18", prep: 20, cook: 30, servings: "3–4", rating: 4.9, ratingCount: 210, commentCount: 83,
    about: ["A fragrant bowl of rice noodles in a rich mushroom broth, with lemongrass, golden tofu and fresh herbs. This plant-based take on a Huế favorite brings warmth and a gentle kick to the table.", "Tô bún chay thơm sả với nước dùng nấm đậm đà, đậu hũ vàng và rau thơm. Phiên bản chay của món ăn xứ Huế mang chút cay ấm đến bữa cơm gia đình."],
    ingredients: [
      { name: ["Rice noodles", "Bún gạo"], amount: ["400 g", "400 g"] }, { name: ["Mixed mushrooms", "Nấm các loại"], amount: ["250 g · sliced", "250 g · thái lát"] }, { name: ["Firm tofu", "Đậu hũ"], amount: ["300 g · cubed", "300 g · cắt miếng"] }, { name: ["Lemongrass", "Sả"], amount: ["3 stalks · lightly bruised", "3 cây · đập dập"] }, { name: ["Vegetable stock", "Nước dùng rau củ"], amount: ["1.5 liters", "1,5 lít"] }, { name: ["Chili oil & fresh herbs", "Dầu ớt & rau thơm"], amount: ["To taste", "Theo khẩu vị"] },
    ],
    steps: [
      { title: ["Build the Broth", "Nấu nước dùng"], time: "00:30", instruction: ["Warm a little oil, sauté the lemongrass and mushrooms, then pour in the vegetable stock. Simmer gently for 20 minutes.", "Phi thơm sả và nấm với chút dầu, thêm nước dùng rau củ rồi đun nhỏ lửa 20 phút."] },
      { title: ["Prepare the Tofu & Noodles", "Chuẩn bị đậu hũ và bún"], time: "02:10", instruction: ["Pan-fry the tofu until golden. Cook the noodles according to the package instructions and divide between warm bowls.", "Chiên đậu hũ vàng. Trụng bún theo hướng dẫn trên bao bì rồi chia vào tô."] },
      { title: ["Season & Serve", "Nêm và thưởng thức"], time: "04:30", instruction: ["Add tofu to the broth, season with soy sauce and chili oil, and ladle over the noodles. Finish with herbs and a squeeze of lime.", "Cho đậu hũ vào nước dùng, nêm nước tương và dầu ớt. Chan lên bún, thêm rau thơm và chút nước cốt chanh."] },
    ],
    tip: ["Bruise lemongrass stalks before simmering to release their citrus aroma. Add chili oil gradually so everyone can enjoy their preferred level of heat.", "Đập dập sả trước khi nấu để hương thơm lan vào nước dùng. Thêm dầu ớt từng chút để điều chỉnh độ cay phù hợp."], pairing: ["Fresh herbs, lime and crunchy bean sprouts", "Rau thơm, chanh và giá giòn"], season: { title: ["A Bowl for Rainy Days", "Tô bún cho ngày mưa"], text: ["A warming broth and seasonal mushrooms make this a comforting meal to share on a cool evening.", "Nước dùng ấm và nấm theo mùa tạo nên bữa ăn dễ chịu cho buổi tối mát trời."] },
    comments: [{ id: "hue-1", name: "Anh Pham", initials: "AP", date: ["1 day ago", "1 ngày trước"], text: ["The lemongrass aroma is wonderful. I added extra mushrooms and it worked beautifully!", "Mùi sả thơm quá! Mình thêm nhiều nấm hơn và món ăn rất ngon."] }],
  },
  {
    slug: "mushroom-spring-rolls", title: ["Crispy Mushroom Spring Rolls", "Chả giò nấm giòn rụm"], subtitle: "Chả Giò Nấm", category: ["PLANT-FORWARD FAMILY FAVORITES", "MÓN CHAY CHO CẢ GIA ĐÌNH"], author: "Anna Le", image: "/images/recipe_spring_rolls.png", duration: "04:52", prep: 20, cook: 15, servings: "3–4", rating: 4.7, ratingCount: 95, commentCount: 29,
    about: ["Golden, crisp rolls filled with mushrooms, glass noodles and colorful vegetables. Wrap, fry and share with fresh lettuce and a tangy, plant-based dipping sauce.", "Chả giò vàng giòn với nhân nấm, miến và rau củ nhiều màu. Cuốn, chiên rồi thưởng thức cùng xà lách và nước chấm chay chua ngọt."],
    ingredients: [{ name: ["Spring roll wrappers", "Bánh tráng cuốn chả giò"], amount: ["12 sheets", "12 lá"] }, { name: ["Mixed mushrooms", "Nấm các loại"], amount: ["200 g · finely chopped", "200 g · băm nhỏ"] }, { name: ["Glass noodles", "Miến"], amount: ["50 g · soaked & cut", "50 g · ngâm mềm, cắt ngắn"] }, { name: ["Carrot", "Cà rốt"], amount: ["1 · grated", "1 củ · bào sợi"] }, { name: ["Cabbage", "Bắp cải"], amount: ["100 g · thinly sliced", "100 g · thái mỏng"] }, { name: ["Soy sauce & cooking oil", "Nước tương & dầu ăn"], amount: ["As needed", "Vừa đủ"] }],
    steps: [{ title: ["Prepare the Filling", "Làm nhân"], time: "00:20", instruction: ["Combine chopped mushrooms, glass noodles, carrot and cabbage. Season lightly with soy sauce and pepper.", "Trộn nấm, miến, cà rốt và bắp cải. Nêm nhẹ với nước tương và tiêu."] }, { title: ["Wrap the Rolls", "Cuốn chả giò"], time: "01:30", instruction: ["Place a spoonful of filling on each wrapper. Fold in the sides and roll snugly, sealing the edge with a little water.", "Cho một thìa nhân lên mỗi lá bánh. Gấp hai bên rồi cuốn chặt vừa phải, dùng chút nước để dán mép."] }, { title: ["Fry & Share", "Chiên và thưởng thức"], time: "03:10", instruction: ["Fry in medium-hot oil until golden and crisp. Drain on a rack and serve with lettuce, herbs and a vegetarian dipping sauce.", "Chiên trong dầu nóng vừa đến khi vàng giòn. Để ráo trên vỉ rồi dùng với xà lách, rau thơm và nước chấm chay."] }],
    tip: ["Keep the filling dry and let it cool before wrapping. A small amount of filling helps the rolls cook evenly and stay crisp.", "Giữ nhân ráo và để nguội trước khi cuốn. Cho lượng nhân vừa phải để chả giò chín đều và giòn hơn."], pairing: ["Fresh lettuce and a lime-soy dipping sauce", "Xà lách tươi và nước chấm chanh–nước tương"], season: { title: ["Garden Vegetables, All Year", "Rau củ quanh năm"], text: ["Swap in your favorite seasonal vegetables and keep the mushroom base for a satisfying, savory filling.", "Thay rau củ theo mùa bạn thích, giữ phần nấm để nhân luôn đậm đà." ] }, comments: [{ id: "roll-1", name: "Thao Vu", initials: "TV", date: ["2 days ago", "2 ngày trước"], text: ["So crisp and easy to make. These disappeared from our dinner table in minutes!", "Giòn và dễ làm quá. Cả nhà mình ăn hết chỉ trong vài phút!"] }],
  },
  {
    slug: "claypot-tofu", title: ["Claypot Braised Tofu & Eggplant", "Đậu hũ và cà tím kho niêu"], subtitle: "Đậu Hũ Cà Tím Kho Tộ", category: ["SLOW & SOULFUL COOKING", "MÓN KHO ĐẬM ĐÀ"], author: "Bao Pham", image: "/images/recipe_claypot_tofu.png", duration: "08:20", prep: 15, cook: 25, servings: "2–3", rating: 4.8, ratingCount: 164, commentCount: 67,
    about: ["Tender eggplant and golden tofu slowly braised in a savory soy sauce glaze. A peppery, comforting claypot dish that turns simple pantry staples into a memorable meal.", "Cà tím mềm và đậu hũ vàng được kho chậm trong sốt nước tương đậm đà. Món kho niêu thơm tiêu biến nguyên liệu quen thuộc thành bữa cơm đáng nhớ."],
    ingredients: [{ name: ["Firm tofu", "Đậu hũ"], amount: ["300 g · cubed", "300 g · cắt miếng"] }, { name: ["Eggplant", "Cà tím"], amount: ["2 small · cut into wedges", "2 quả nhỏ · cắt miếng"] }, { name: ["Shiitake mushrooms", "Nấm hương"], amount: ["100 g", "100 g"] }, { name: ["Soy sauce", "Nước tương"], amount: ["2 tbsp", "2 thìa canh"] }, { name: ["Cane sugar & black pepper", "Đường mía & tiêu đen"], amount: ["1 tsp each", "Mỗi loại 1 thìa cà phê"] }, { name: ["Scallions & cooking oil", "Hành lá & dầu ăn"], amount: ["As needed", "Vừa đủ"] }],
    steps: [{ title: ["Sear the Tofu", "Chiên đậu hũ"], time: "00:35", instruction: ["Pat tofu dry and pan-fry until golden. Lightly sear the eggplant wedges in the same pan.", "Thấm khô đậu hũ và chiên vàng. Áp chảo nhẹ cà tím trong cùng chảo."] }, { title: ["Build the Glaze", "Làm sốt kho"], time: "02:20", instruction: ["Warm sugar in a claypot until lightly caramelized. Add soy sauce, mushrooms and a small splash of water.", "Đun đường trong niêu đến khi ngả màu nhẹ. Thêm nước tương, nấm và chút nước."] }, { title: ["Braise Slowly", "Kho nhỏ lửa"], time: "05:00", instruction: ["Add tofu and eggplant. Cover and simmer for 15 minutes. Finish with black pepper and scallions, then serve with rice.", "Cho đậu hũ và cà tím vào. Đậy nắp, kho nhỏ lửa 15 phút. Thêm tiêu và hành lá rồi dùng với cơm."] }],
    tip: ["Keep the heat low once the sauce thickens. A gentle simmer lets the tofu absorb the glaze while the eggplant stays soft and intact.", "Giảm lửa khi sốt bắt đầu sánh. Kho nhẹ giúp đậu hũ thấm vị mà cà tím vẫn mềm, không nát."], pairing: ["Steamed rice and crisp cucumber slices", "Cơm nóng và dưa leo giòn"], season: { title: ["A Slow Sunday Table", "Bữa cơm Chủ nhật"], text: ["Make this claypot the centerpiece of a relaxed family meal, with fresh greens and a pot of warm tea.", "Đặt niêu kho giữa mâm cơm gia đình, thêm rau xanh và ấm trà nóng cho bữa ăn thư thái."] }, comments: [{ id: "clay-1", name: "Linh Nguyen", initials: "LN", date: ["1 day ago", "1 ngày trước"], text: ["The sauce is so comforting. Next time I’ll double the recipe for leftovers!", "Sốt kho ngon quá. Lần sau mình sẽ nấu gấp đôi để dành cho hôm sau!"] }],
  },
];

export function getDetailRecipe(slug: string) {
  return detailRecipes.find((recipe) => recipe.slug === slug);
}
