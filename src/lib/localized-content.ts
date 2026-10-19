import type { Language } from "@/context/LanguageContext";

const recipeTitleVi: Record<string, string> = {
  "Mushroom Ginger Rice Bowl": "Cơm nấm gừng",
  "Lemongrass Mushroom Vermicelli": "Bún nấm sả",
  "Tomato Mushroom Claypot": "Nấm kho cà chua niêu đất",
  "Pumpkin Coconut Soup": "Súp bí đỏ nước cốt dừa",
  "Lotus Root Mushroom Stir Fry": "Củ sen xào nấm",
  "Chickpea Spinach Curry": "Cà ri đậu gà cải bó xôi",
  "Red Lentil Sweet Potato Dal": "Dal đậu lăng đỏ khoai lang",
  "Garden Vegetable Fried Rice": "Cơm chiên rau củ",
  "Bitter Melon Mushroom Soup": "Canh khổ qua nấm",
  "Braised Banana Blossom": "Bắp chuối kho cà chua",
  "Cauliflower Turmeric Roast": "Bông cải nướng nghệ",
  "Kabocha Mushroom Porridge": "Cháo bí đỏ nấm",
  "Herb Rice Paper Rolls": "Gỏi cuốn rau thơm",
  "Mung Bean Coconut Pudding": "Chè đậu xanh nước cốt dừa",
  "Stir Fried Morning Glory": "Rau muống xào tỏi",
  "Mushroom Pho Broth": "Phở nấm chay",
  "Vegetable Hotpot": "Lẩu rau củ chay",
  "Eggplant Basil Rice": "Cơm cà tím húng quế",
  "Okra Tomato Stew": "Đậu bắp hầm cà chua",
  "Jackfruit Lemongrass Bowl": "Cơm mít non xào sả",
  "Seaweed Mushroom Soup": "Canh rong biển nấm",
  "Tofu Tomato Skillet": "Đậu hũ sốt cà chua",
  "Tofu Mushroom Lettuce Cups": "Xà lách cuốn đậu hũ nấm",
  "Soy Milk Oat Porridge": "Cháo yến mạch sữa đậu nành",
  "Peanut Mushroom Noodles": "Bún nấm sốt đậu phộng",
  "Cashew Vegetable Curry": "Cà ri rau củ hạt điều",
  "Sesame Tofu Soba": "Mì soba đậu hũ mè",
  "Cheesy Mushroom Omelet Rice": "Cơm trứng nấm phô mai",
  "Yogurt Herb Cucumber Bowl": "Cơm dưa leo sữa chua rau thơm",
  "Honey Roasted Carrots": "Cà rốt nướng mật ong",
  "Miso Eggplant Rice": "Cơm cà tím miso",
  "Almond Pumpkin Salad": "Salad bí đỏ hạnh nhân",
  "Wheat Noodle Mushroom Soup": "Mì lúa mì nước nấm",
  "Crispy Tofu Turmeric Rice": "Cơm nghệ đậu hũ giòn",
  "Edamame Corn Rice": "Cơm đậu nành Nhật bắp",
  "Walnut Herb Pasta": "Mì pasta rau thơm óc chó",
  "Rice Noodle Mango Salad": "Salad bún xoài",
  "Daikon Carrot Clear Soup": "Canh củ cải cà rốt",
  "Sweet Corn Mushroom Chowder": "Súp bắp ngọt nấm",
  "Water Spinach Rice Bowl": "Cơm rau muống xào tỏi",
  "Tamarind Vegetable Soup": "Canh chua rau củ",
  "Mushroom Stuffed Bell Peppers": "Ớt chuông nhồi cơm nấm",
  "Cabbage Mushroom Rolls": "Bắp cải cuốn nấm",
  "Coconut Green Bean Stew": "Đậu que hầm nước cốt dừa",
  "Roasted Beetroot Rice Plate": "Cơm củ dền nướng",
  "Mushroom Pineapple Fried Rice": "Cơm chiên thơm nấm",
  "Black Bean Vegetable Chili": "Đậu đen hầm rau củ",
  "Lentil Mushroom Lettuce Bowl": "Bát đậu lăng nấm xà lách",
  "Ginger Carrot Rice Soup": "Cháo cà rốt gừng",
  "Herbed Potato Mushroom Bake": "Khoai tây nấm đút lò rau thơm",
};

const defaultRecipeTextVi: Record<string, string> = {
  "Underweight": "Thiếu cân",
  "Normal": "Bình thường",
  "Overweight": "Thừa cân",
  "Obese": "Béo phì",
  "Brown rice with mixed mushrooms, ginger and herbs.": "Cơm gạo lứt với nấm, gừng và rau thơm.",
  "Rice vermicelli topped with lemongrass mushrooms and greens.": "Bún với nấm xào sả và rau xanh.",
  "A savory claypot stew with tomato, mushroom and eggplant.": "Nấm, cà chua và cà tím kho niêu đậm đà.",
  "Creamy pumpkin soup with coconut milk and basil.": "Súp bí đỏ béo mịn với nước cốt dừa và húng quế.",
  "Crisp lotus root tossed with mushrooms and sesame.": "Củ sen giòn xào nấm và mè.",
  "Plant protein curry with chickpeas and spinach.": "Cà ri giàu đạm thực vật với đậu gà và cải bó xôi.",
  "Comforting dal with sweet potato and turmeric.": "Đậu lăng hầm khoai lang và nghệ.",
  "Fast fried rice with corn, carrot and peas.": "Cơm chiên nhanh với bắp, cà rốt và đậu Hà Lan.",
  "Light Vietnamese-style soup with bitter melon and mushroom.": "Canh khổ qua nấm thanh nhẹ kiểu Việt Nam.",
  "Banana blossom braised with tomato and herbs.": "Bắp chuối kho cà chua và rau thơm.",
  "Golden cauliflower roasted with turmeric and lime.": "Bông cải nướng vàng với nghệ và chanh.",
  "Soft kabocha rice porridge with mushrooms.": "Cháo bí đỏ nấm mềm thơm.",
  "Fresh rolls with herbs, avocado and vegetables.": "Gỏi cuốn tươi với rau thơm, bơ và rau củ.",
  "Soft mung bean dessert with coconut and pandan.": "Chè đậu xanh mềm với nước cốt dừa và lá dứa.",
  "Crisp morning glory with garlic and chili.": "Rau muống giòn xào tỏi và ớt.",
  "Aromatic pho broth with mushrooms and rice noodles.": "Phở nấm với nước dùng thơm đậm đà.",
  "Clear vegetable hotpot with mushrooms and greens.": "Lẩu rau củ với nấm và rau xanh, nước dùng thanh nhẹ.",
  "Pan-seared eggplant with basil over rice.": "Cơm cà tím áp chảo với húng quế.",
  "Okra simmered with tomato and herbs.": "Đậu bắp hầm cà chua và rau thơm.",
  "Young jackfruit stir-fried with lemongrass.": "Mít non xào sả.",
  "Mineral-rich soup with seaweed and mushrooms.": "Canh rong biển nấm giàu khoáng chất.",
  "Classic tofu simmered in tomato sauce.": "Đậu hũ sốt cà chua truyền thống.",
  "Crisp lettuce cups with tofu and mushrooms.": "Xà lách giòn cuốn đậu hũ và nấm.",
  "Warm breakfast porridge with soy milk and banana.": "Cháo sáng ấm với sữa đậu nành và chuối.",
  "Rice noodles with mushrooms and peanut sauce.": "Bún nấm với sốt đậu phộng.",
  "Vegetable curry finished with cashew cream.": "Cà ri rau củ với sốt hạt điều béo mịn.",
  "Buckwheat soba with sesame tofu and herbs.": "Mì kiều mạch với đậu hũ mè và rau thơm.",
  "Lacto-ovo vegetarian rice with mushrooms.": "Cơm nấm chay có trứng và chế phẩm từ sữa.",
  "Cooling cucumber rice bowl with yogurt herbs.": "Cơm dưa leo thanh mát với sữa chua và rau thơm.",
  "Carrots roasted with honey and thyme.": "Cà rốt nướng mật ong và cỏ xạ hương.",
  "Miso-glazed eggplant with steamed rice.": "Cơm cà tím phủ sốt tương lên men.",
  "Roasted pumpkin salad with almonds.": "Rau trộn bí đỏ nướng và hạnh nhân.",
  "Wheat noodles in a mushroom broth.": "Mì lúa mì với nước dùng nấm.",
  "Turmeric rice topped with crispy tofu.": "Cơm nghệ với đậu hũ giòn.",
  "Quick rice bowl with edamame and corn.": "Cơm nhanh với đậu nành Nhật và bắp.",
  "Herb pasta with toasted walnuts.": "Mì rau thơm với hạt óc chó rang.",
  "Bright rice noodle salad with mango and herbs.": "Bún trộn xoài và rau thơm tươi mát.",
  "Simple clear soup with daikon and carrot.": "Canh củ cải trắng và cà rốt thanh nhẹ.",
  "Dairy-free chowder with corn and mushrooms.": "Súp bắp nấm sánh mịn không dùng sữa.",
  "Garlicky water spinach over warm rice.": "Cơm nóng với rau muống xào tỏi.",
  "Sour tamarind soup with pineapple and okra.": "Canh chua me với thơm và đậu bắp.",
  "Bell peppers filled with mushroom rice.": "Ớt chuông nhồi cơm nấm.",
  "Cabbage leaves wrapped around mushroom rice.": "Lá bắp cải cuốn cơm nấm.",
  "Green beans simmered with coconut and tomato.": "Đậu que hầm nước cốt dừa và cà chua.",
  "Earthy roasted beets with rice and herbs.": "Cơm củ dền nướng với rau thơm.",
  "Sweet-sour fried rice with pineapple and mushrooms.": "Cơm chiên thơm nấm có vị chua ngọt.",
  "Hearty chili with black beans and vegetables.": "Đậu đen hầm rau củ đậm đà.",
  "Protein-rich lentil bowl with mushrooms.": "Đậu lăng nấm giàu đạm.",
  "Light rice soup with carrot and ginger.": "Cháo cà rốt gừng thanh nhẹ.",
  "Baked potatoes and mushrooms with herbs.": "Khoai tây nấm đút lò với rau thơm.",
  "Prepare and wash all vegetables.": "Sơ chế và rửa sạch tất cả rau củ.",
  "Cook the main ingredients until tender and fragrant.": "Nấu nguyên liệu chính đến khi mềm và dậy mùi thơm.",
  "Season to taste and serve warm.": "Nêm vừa ăn và dùng khi còn ấm.",
};

const ingredientVi: Record<string, string> = {
  "brown rice": "gạo lứt", rice: "gạo", mushroom: "nấm", ginger: "gừng", "bok choy": "cải thìa",
  "rice vermicelli": "bún", lemongrass: "sả", lettuce: "xà lách", tomato: "cà chua", eggplant: "cà tím",
  "spring onion": "hành lá", pumpkin: "bí đỏ", "coconut milk": "nước cốt dừa", basil: "húng quế", carrot: "cà rốt",
  "lotus root": "củ sen", "sesame seed": "hạt mè", "snow pea": "đậu Hà Lan trái", chickpea: "đậu gà", spinach: "cải bó xôi",
  "red lentil": "đậu lăng đỏ", "sweet potato": "khoai lang", turmeric: "nghệ", cilantro: "ngò rí", corn: "bắp",
  "green pea": "đậu Hà Lan", "bitter melon": "khổ qua", "glass noodle": "miến", "banana blossom": "bắp chuối", perilla: "tía tô",
  cauliflower: "bông cải trắng", lime: "chanh", cucumber: "dưa leo", kabocha: "bí đỏ Nhật", "rice paper": "bánh tráng",
  avocado: "bơ", mint: "bạc hà", "mung bean": "đậu xanh", pandan: "lá dứa", "cane sugar": "đường mía",
  "morning glory": "rau muống", garlic: "tỏi", chili: "ớt", "rice noodle": "bánh phở", "star anise": "hoa hồi",
  cinnamon: "quế", "napa cabbage": "cải thảo", daikon: "củ cải trắng", okra: "đậu bắp", onion: "hành tây",
  "young jackfruit": "mít non", seaweed: "rong biển", tofu: "đậu hũ", "soy milk": "sữa đậu nành", oat: "yến mạch",
  banana: "chuối", "chia seed": "hạt chia", peanut: "đậu phộng", cashew: "hạt điều", potato: "khoai tây",
  "soba noodle": "mì kiều mạch", egg: "trứng", cheese: "phô mai", yogurt: "sữa chua", honey: "mật ong",
  thyme: "cỏ xạ hương", miso: "tương lên men", almond: "hạnh nhân", orange: "cam", "wheat noodle": "mì lúa mì",
  edamame: "đậu nành Nhật", pasta: "mì Ý", walnut: "hạt óc chó", mango: "xoài", "water spinach": "rau muống",
  tamarind: "me", "bell pepper": "ớt chuông", parsley: "ngò tây", cabbage: "bắp cải", "green bean": "đậu que",
  beetroot: "củ dền", pineapple: "thơm", "black bean": "đậu đen", lentil: "đậu lăng", rosemary: "hương thảo",
  milk: "sữa", soy: "đậu nành", gluten: "gluten", "tree nut": "hạt cây",
};
const unitVi: Record<string, string> = { tbsp: "thìa canh", tsp: "thìa cà phê", cup: "cốc", cups: "cốc", stalks: "cọng", stalk: "cọng", handful: "nắm", leaves: "lá", cloves: "tép", ears: "trái", head: "bắp", stick: "thanh", sheets: "miếng" };
const uploadErrorVi: Record<string, string> = {
  "The AI provider took too long to answer. Please try again.": "Dịch vụ AI phản hồi quá thời gian chờ. Vui lòng thử lại.",
  "Video processing timed out. Please retry or use a shorter video.": "Xử lý video quá thời gian chờ. Hãy thử lại hoặc dùng video ngắn hơn.",
  "Video processing was interrupted or timed out. Please retry.": "Xử lý video bị gián đoạn hoặc quá thời gian chờ. Hãy thử lại.",
  "An unexpected server error occurred.": "Máy chủ gặp lỗi khi xử lý yêu cầu.",
  "Unable to connect to Cloudinary to upload the video. Please try again.": "Không thể kết nối Cloudinary để tải video. Vui lòng thử lại.",
  "Cloudinary video upload timed out. Please try again or use a smaller video.": "Tải video lên Cloudinary quá thời gian chờ. Hãy thử lại hoặc dùng video nhỏ hơn.",
  "Cloudinary could not upload the video.": "Cloudinary không thể tải video. Vui lòng thử lại.",
  "Cloudinary did not return a secure video URL.": "Cloudinary chưa trả về đường dẫn video hợp lệ. Vui lòng thử lại.",
  "An external service is temporarily unavailable. Please try again.": "Dịch vụ bên ngoài tạm thời không khả dụng. Vui lòng thử lại.",
};
const textEn = Object.fromEntries(Object.entries({ ...recipeTitleVi, ...defaultRecipeTextVi, ...uploadErrorVi }).map(([en, vi]) => [vi, en]));
const ingredientEn = Object.fromEntries(Object.entries(ingredientVi).map(([en, vi]) => [vi, en]));

export function localizeIngredient(value: string, language: Language) {
  return language === "vi" ? ingredientVi[value.trim().toLowerCase()] ?? value : ingredientEn[value.trim().toLowerCase()] ?? value;
}
export function localizeAmount(value: string | null | undefined, language: Language) {
  if (!value || language !== "vi") return value ?? "";
  return value.replace(/\b(tbsp|tsp|cups?|stalks?|handful|leaves|cloves|ears|head|stick|sheets)\b/gi, unit => unitVi[unit.toLowerCase()] ?? unit);
}

export function localizeText(value: string | null | undefined, language: Language): string {
  if (!value) return "";
  if (value.includes("\n") && (uploadErrorVi[value.split("\n")[0]] || textEn[value.split("\n")[0]]))
    return value.split("\n").map((line, index) => index === 0 ? localizeText(line, language) : line).join("\n");
  if (language === "en") return textEn[value] ?? value;
  return recipeTitleVi[value] ?? defaultRecipeTextVi[value] ?? uploadErrorVi[value] ?? value;
}

export function localizeRecipeTitle(value: string | null | undefined, language: Language) {
  return localizeText(value, language);
}
