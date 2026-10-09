import type { Area, Province, Restaurant } from "@/types/location";

// Vietnam has 34 provincial-level units after the 2025 administrative reorganisation.
// Ward/commune data stays separate because it will eventually come from the backend dataset.
export const vietnamProvinces: Province[] = [
  ["hanoi", "Hà Nội", "Thành phố"], ["hue", "Huế", "Thành phố"],
  ["haiphong", "Hải Phòng", "Thành phố"], ["danang", "Đà Nẵng", "Thành phố"],
  ["cantho", "Cần Thơ", "Thành phố"], ["hochiminh", "Tp. Hồ Chí Minh", "Thành phố"],
  ["laocai", "Lào Cai", "Tỉnh"], ["tuyenquang", "Tuyên Quang", "Tỉnh"],
  ["caobang", "Cao Bằng", "Tỉnh"], ["laichau", "Lai Châu", "Tỉnh"],
  ["dienbien", "Điện Biên", "Tỉnh"], ["sonla", "Sơn La", "Tỉnh"],
  ["langson", "Lạng Sơn", "Tỉnh"], ["quangninh", "Quảng Ninh", "Tỉnh"],
  ["thanhhoa", "Thanh Hóa", "Tỉnh"], ["nghean", "Nghệ An", "Tỉnh"],
  ["hatinh", "Hà Tĩnh", "Tỉnh"], ["quangtri", "Quảng Trị", "Tỉnh"],
  ["quangngai", "Quảng Ngãi", "Tỉnh"], ["gialai", "Gia Lai", "Tỉnh"],
  ["khanhhoa", "Khánh Hòa", "Tỉnh"], ["lamdong", "Lâm Đồng", "Tỉnh"],
  ["daklak", "Đắk Lắk", "Tỉnh"], ["dongnai", "Đồng Nai", "Tỉnh"],
  ["tayninh", "Tây Ninh", "Tỉnh"], ["dongthap", "Đồng Tháp", "Tỉnh"],
  ["vinhlong", "Vĩnh Long", "Tỉnh"], ["angiang", "An Giang", "Tỉnh"],
  ["camau", "Cà Mau", "Tỉnh"], ["bacninh", "Bắc Ninh", "Tỉnh"],
  ["phutho", "Phú Thọ", "Tỉnh"], ["thainguyen", "Thái Nguyên", "Tỉnh"],
  ["hungyen", "Hưng Yên", "Tỉnh"], ["ninhbinh", "Ninh Bình", "Tỉnh"],
].map(([code, name, type]) => ({ code, name, type }));

const knownAreas: Record<string, Area[]> = {
  hochiminh: [
    ["all", "Tất cả", "Khu vực"], ["thu-duc", "Phường Thủ Đức", "Phường"],
    ["linh-xuan", "Phường Linh Xuân", "Phường"], ["tam-binh", "Phường Tam Bình", "Phường"],
    ["tang-nhon-phu", "Phường Tăng Nhơn Phú", "Phường"], ["sai-gon", "Phường Sài Gòn", "Phường"],
    ["ben-thanh", "Phường Bến Thành", "Phường"], ["xuan-hoa", "Phường Xuân Hòa", "Phường"],
    ["ban-co", "Phường Bàn Cờ", "Phường"], ["phu-nhuan", "Phường Phú Nhuận", "Phường"],
    ["tan-son-hoa", "Phường Tân Sơn Hòa", "Phường"], ["cho-lon", "Phường Chợ Lớn", "Phường"],
    ["an-dong", "Phường An Đông", "Phường"],
  ].map(([code, name, type]) => ({ code, name, type })),
  hanoi: [
    ["all", "Tất cả", "Khu vực"], ["hoan-kiem", "Phường Hoàn Kiếm", "Phường"],
    ["ba-dinh", "Phường Ba Đình", "Phường"], ["cua-nam", "Phường Cửa Nam", "Phường"],
    ["hai-ba-trung", "Phường Hai Bà Trưng", "Phường"], ["tay-ho", "Phường Tây Hồ", "Phường"],
    ["cau-giay", "Phường Cầu Giấy", "Phường"],
  ].map(([code, name, type]) => ({ code, name, type })),
  danang: [
    ["all", "Tất cả", "Khu vực"], ["hai-chau", "Phường Hải Châu", "Phường"],
    ["son-tra", "Phường Sơn Trà", "Phường"], ["ngu-hanh-son", "Phường Ngũ Hành Sơn", "Phường"],
    ["an-hai", "Phường An Hải", "Phường"],
  ].map(([code, name, type]) => ({ code, name, type })),
};

export function fallbackAreas(provinceCode: string): Area[] {
  return knownAreas[provinceCode] ?? [{ code: "all", name: "Tất cả", type: "Khu vực" }];
}

export const fallbackRestaurants: Restaurant[] = [
  { id: "loving-leaf", name: "Loving Leaf Vegan", category: "Vegan", address: "Phường Sài Gòn, TP. Hồ Chí Minh", provinceCode: "hochiminh", areaCode: "sai-gon", latitude: 10.7781, longitude: 106.6978, rating: 4.9, reviewCount: 98 },
  { id: "om-mani", name: "Om Mani Vegetarian Bistro", category: "Vegetarian", address: "Phường Xuân Hòa, TP. Hồ Chí Minh", provinceCode: "hochiminh", areaCode: "xuan-hoa", latitude: 10.7869, longitude: 106.6847, rating: 4.8, reviewCount: 142 },
  { id: "an-nhien", name: "An Nhiên Vegetarian House", category: "Vegetarian", address: "Phường Phú Nhuận, TP. Hồ Chí Minh", provinceCode: "hochiminh", areaCode: "phu-nhuan", latitude: 10.7991, longitude: 106.6797, rating: 4.7, reviewCount: 215 },
  { id: "sen-thu-duc", name: "Sen Vegan Thủ Đức", category: "Vegan", address: "Phường Thủ Đức, TP. Hồ Chí Minh", provinceCode: "hochiminh", areaCode: "thu-duc", latitude: 10.8496, longitude: 106.7537, rating: 4.8, reviewCount: 76 },
  { id: "uu-dam", name: "Ưu Đàm Chay", category: "Vegetarian", address: "Phường Cửa Nam, Hà Nội", provinceCode: "hanoi", areaCode: "cua-nam", latitude: 21.0245, longitude: 105.8442, rating: 4.7, reviewCount: 331 },
  { id: "roots", name: "Roots Plant-based Cafe", category: "Vegan", address: "Phường Ngũ Hành Sơn, Đà Nẵng", provinceCode: "danang", areaCode: "ngu-hanh-son", latitude: 16.0489, longitude: 108.2422, rating: 4.8, reviewCount: 189 },
];

export const provinceCenters: Record<string, { lat: number; lng: number }> = {
  hochiminh: { lat: 10.8231, lng: 106.6297 },
  hanoi: { lat: 21.0278, lng: 105.8342 },
  danang: { lat: 16.0544, lng: 108.2022 },
  hue: { lat: 16.4637, lng: 107.5909 },
  haiphong: { lat: 20.8449, lng: 106.6881 },
  cantho: { lat: 10.0452, lng: 105.7469 },
};
