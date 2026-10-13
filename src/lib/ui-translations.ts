import type { Language } from "@/context/LanguageContext";

// UI copy only. Author-entered content and arbitrary backend messages are not translated.
const copy = `
EDITORIAL WORKBENCH|GÓC BIÊN SOẠN
Create Content|Tạo bài viết
Share your plant-based recipe with the community.|Chia sẻ công thức món chay của bạn với cộng đồng.
STEP 1: CHOOSE HOW TO CREATE|BƯỚC 1: CHỌN CÁCH TẠO BÀI
Step 1 of 4|Bước 1 trên 4
Generate with AI|Tạo với AI
Recommended|Đề xuất
Upload a cooking video. AI creates an editable draft of ingredients and steps for you to review.|Tải video nấu ăn lên. AI tạo bản nháp nguyên liệu và các bước để bạn kiểm tra, chỉnh sửa.
Automatically identify ingredients & recipes|Tự động nhận diện nguyên liệu & công thức
Write Manually|Viết thủ công
Standard|Thông thường
Enter ingredients, measurements, and cooking technique manually. Video attachment remains completely optional.|Tự nhập nguyên liệu, định lượng và cách nấu. Bạn có thể đính kèm video nếu muốn.
Edit every detail yourself|Tự do điều chỉnh toàn bộ chi tiết
Recipe details|Chi tiết công thức
REQUIRED DETAILS|THÔNG TIN BẮT BUỘC
Recipe title|Tên công thức
e.g. Easy Tofu in Tomato Sauce|Ví dụ: Đậu hũ sốt cà chua
Category|Danh mục
Preparation time (minutes)|Thời gian chuẩn bị (phút)
Servings|Khẩu phần ăn
(Manual only)|(Chỉ khi viết thủ công)
Dish description|Mô tả món ăn
A comforting home-cooked dish featuring pan-seared golden tofu braised in a fresh, savory tomato reduction...|Món đậu hũ áp chảo vàng, rim cùng sốt cà chua tươi đậm đà cho bữa cơm gia đình...
Cooking video|Video nấu ăn
AI POWERED EXTRACTION|PHÂN TÍCH BẰNG AI
Upload cooking video|Tải video nấu ăn lên
MP4, MOV, WEBM, AVI (up to 100 MB)|MP4, MOV, WEBM, AVI (tối đa 100 MB)
Choose a cooking video from your device|Chọn video nấu ăn từ thiết bị
Supports MP4, MOV, WEBM or AVI (under 100 MB)|Hỗ trợ MP4, MOV, WEBM hoặc AVI (dưới 100 MB)
Uploaded video|Video đã tải lên
✓ Ready|✓ Đã phân tích
⚙️ Processing...|⚙️ Đang phân tích...
⏳ Pending|⏳ Chờ xử lý
✕ Processing failed|✕ Lỗi xử lý
Not submitted for analysis|Chưa gửi phân tích
Audio speech & step analysis|Phân tích giọng nói & các bước
Recognizing speech...|Đang nhận diện giọng nói...
Replace video|Thay video
Retry analysis|Phân tích lại
Uploading video...|Đang tải video...
AI is analyzing...|AI đang phân tích...
Generate draft|Tạo bản nháp
AI draft - review required before publishing|Bản nháp AI - cần kiểm tra trước khi đăng
Ingredients|Nguyên liệu
Edit quantities, ingredient names, and verify pantry provenance.|Chỉnh định lượng, tên nguyên liệu và kiểm tra nguồn gốc.
Add ingredient|Thêm nguyên liệu
e.g. 400 g / 2 tbsp|Ví dụ: 400 g / 2 thìa canh
Ingredient name (e.g. tofu)|Tên nguyên liệu (ví dụ: đậu hũ)
(No allergens)|(Không dị ứng)
⚠️ Ingredient group|⚠️ Nhóm nguyên liệu
affects vegan diet compatibility.|ảnh hưởng đến độ tương thích với chế độ thuần chay.
Needs Clarification|Cần làm rõ
Diet compatibility|Chế độ ăn phù hợp
Based on ingredients confirmed by author|Dựa trên nguyên liệu tác giả đã xác nhận
Evaluates listed ingredients against vegetarian classifications. Helps mindful diners discover suitable options with confidence.|Đối chiếu nguyên liệu với từng chế độ ăn chay để người đọc chọn món phù hợp.
✓ Compatible|✓ Phù hợp
Needs clarification|Cần làm rõ
All ingredients are in the allowed groups.|Tất cả nguyên liệu thuộc nhóm cho phép.
Contains ingredients outside the group|Có nguyên liệu ngoài nhóm
The server calculates and saves compatible diet types when the recipe is published.|Máy chủ sẽ tính toán và lưu các chế độ ăn phù hợp khi công thức được đăng.
Cooking steps|Các bước nấu
Step-by-step guidance formatted with culinary precision.|Hướng dẫn từng bước rõ ràng, dễ thực hiện.
Add step|Thêm bước
STEP|BƯỚC
Delete this step|Xóa bước này
✕ Delete|✕ Xóa
Describe the cooking technique, heat and timing for this step...|Mô tả kỹ thuật nấu, lửa và thời gian cho bước này...
I have reviewed the ingredients and cooking steps.|Tôi đã kiểm tra nguyên liệu và các bước nấu.
Published recipes become available after you confirm ingredient provenance, resolve warnings, and verify step instructions.|Kiểm tra nguồn gốc nguyên liệu, xử lý cảnh báo và xác nhận hướng dẫn trước khi đăng công thức.
Discard your changes?|Bạn có chắc chắn muốn hủy các thay đổi?
✕ Discard changes|✕ Hủy thay đổi
Save draft|Lưu bản nháp
Publishing...|Đang xuất bản...
Publish recipe|Đăng công thức
View post|Xem bài viết
You are browsing as a guest. Sign in to save drafts and publish recipes.|Bạn đang xem ở chế độ khách. Vui lòng đăng nhập để lưu bản nháp và đăng công thức.
Plant|Thực vật
Dairy|Sữa
Egg|Trứng
Honey|Mật ong
100% plant-based|100% gốc thực vật
Butter, yogurt, cheese...|Bơ, sữa chua, phô mai...
Chicken eggs, duck eggs...|Trứng gà, vịt...
Natural honey|Mật ong tự nhiên
AI has finished analyzing the video. Review your draft below.|AI đã hoàn tất phân tích video và tạo bản nháp thành công! Vui lòng kiểm tra lại bên dưới.
Video processing failed. You can retry.|Xử lý video thất bại. Bạn có thể nhấn Thử lại.
Maximum video size is 100 MB. Choose a smaller file.|Kích thước video tối đa 100 MB. Vui lòng chọn tệp nhỏ hơn.
Choose a video before generating a draft.|Vui lòng chọn tệp video trước khi bấm Generate draft.
Sign in to generate a recipe from video.|Bạn cần đăng nhập để sử dụng tính năng tạo công thức AI từ video.
Uploading video to the server... Please keep this page open.|Đang tải video lên máy chủ... Vui lòng không đóng trang.
Video uploaded! VeggieAI is analyzing the audio and cooking steps...|Đã tải lên video thành công! VeggieAI đang phân tích âm thanh và các bước nấu...
Video upload failed|Tải lên video thất bại
Retrying analysis...|Đang thử lại phân tích...
Retry failed|Thử lại thất bại
No video draft has been created yet.|Chưa có bản nháp video nào được tạo để lưu.
Only READY drafts can be edited and saved.|Chỉ có thể chỉnh sửa và lưu khi bản nháp ở trạng thái READY.
Video draft saved to the server!|Đã lưu bản nháp video thành công vào máy chủ!
Could not save draft|Lưu bản nháp thất bại
Recipe draft saved in this browser!|Đã lưu bản nháp công thức vào bộ nhớ trình duyệt!
Could not save draft in this browser.|Không thể lưu bản nháp vào bộ nhớ trình duyệt.
Sign in to publish a recipe.|Bạn cần đăng nhập để xuất bản công thức.
Enter a recipe title.|Vui lòng nhập tên công thức món ăn.
Add at least one ingredient.|Vui lòng thêm ít nhất 1 nguyên liệu.
Add at least one cooking step.|Vui lòng thêm ít nhất 1 bước nấu.
Confirm that you have reviewed the ingredients and steps.|Vui lòng đánh dấu xác nhận bạn đã kiểm tra các nguyên liệu và bước nấu.
No AI video draft is available to publish.|Chưa có bản nháp video AI để xuất bản.
The AI draft is not READY to publish.|Bản nháp AI chưa sẵn sàng (READY) để xuất bản.
Publish failed|Đăng công thức thất bại
Home|Trang chủ
Search|Tìm kiếm
Back to Home|Về trang chủ
Back to Homepage|Về trang chủ
Back to Login|Về trang đăng nhập
Loading form...|Đang tải biểu mẫu...
Loading verification form...|Đang tải biểu mẫu xác thực...
Sync Bookmarks|Đồng bộ bài đã lưu
AI Meal Plans|Thực đơn AI
Mindful Table|Bữa ăn lành mạnh
Vegetarian Lifestyle|Lối sống chay
Discover Better|Khám phá cuộc sống
Vegetarian Living|chay tốt đẹp hơn
Find inspiring recipes, cooking videos and restaurant reviews for your everyday vegetarian journey.|Tìm công thức, video nấu ăn và đánh giá nhà hàng cho hành trình ăn chay mỗi ngày.
Explore Recipes|Khám phá công thức
Search recipes, foods, restaurants...|Tìm công thức, món ăn, nhà hàng...
Vegetarian culinary inspiration|Cảm hứng ẩm thực chay
Popular Recipes|Công thức được yêu thích
Discover recipes the community loves.|Khám phá các công thức được cộng đồng yêu thích.
View All Recipes|Xem tất cả công thức
Tofu in Rich Tomato Sauce|Đậu hũ sốt cà chua
Bún Chay Huế (Spicy Hue Vegetarian Noodle…)|Bún chay Huế đậm vị sả…
Crispy Mushroom Spring Rolls|Chả giò nấm giòn rụm
Claypot Braised Tofu & Eggplant with Rice|Đậu hũ và cà tím kho niêu ăn kèm cơm
by Minh Tran|bởi Minh Tran
by Lan Nguyen|bởi Lan Nguyen
by Anna Le|bởi Anna Le
by Bao Pham|bởi Bao Pham
· 5 ratings|· 5 đánh giá
· 210 ratings|· 210 đánh giá
· 95 ratings|· 95 đánh giá
· 164 ratings|· 164 đánh giá
💬 38 comments|💬 38 bình luận
💬 83 comments|💬 83 bình luận
💬 29 comments|💬 29 bình luận
💬 67 comments|💬 67 bình luận
Popular Restaurants|Nhà hàng được yêu thích
Explore vegetarian and vegan places worth discovering.|Khám phá những địa điểm chay đáng trải nghiệm.
Vegan|Thuần chay
Vegetarian|Ăn chay
District 1, Ho Chi Minh City|Quận 1, TP. Hồ Chí Minh
District 3, Ho Chi Minh City|Quận 3, TP. Hồ Chí Minh
Phu Nhuan, Ho Chi Minh City|Phú Nhuận, TP. Hồ Chí Minh
(98 reviews)|(98 đánh giá)
(142 reviews)|(142 đánh giá)
(215 reviews)|(215 đánh giá)
Start with a dish you already love.|Bắt đầu với món ăn bạn yêu thích.
Discover its vegetarian version and explore recipes you can cook.|Tìm phiên bản chay và khám phá công thức bạn có thể tự nấu.
Find a Vegetarian Version|Tìm phiên bản chay
Culinary Directory|Cẩm nang ẩm thực
Search & Explore|Tìm kiếm & khám phá
Find recipes, videos, restaurant reviews and vegetarian places.|Tìm công thức, video, đánh giá nhà hàng và địa điểm chay.
Video & Recipes|Video & công thức
Restaurant Reviews|Đánh giá nhà hàng
Want to discover vegetarian places near you?|Bạn muốn tìm địa điểm chay gần mình?
Sign in and add your living location to get nearby restaurant recommendations.|Đăng nhập và thêm nơi sinh sống để nhận gợi ý nhà hàng gần bạn.
Sign In|Đăng nhập
Vegetarian Places|Địa điểm chay
curated recommendations|gợi ý chọn lọc
Curated for plant nourishment|Chọn lọc cho bữa ăn thực vật
Remove from bookmarks|Bỏ lưu
Save restaurant|Lưu nhà hàng
Details|Chi tiết
No vegetarian places found|Không tìm thấy địa điểm chay
Try clearing or adjusting your search term: “|Thử xóa hoặc sửa từ khóa tìm kiếm: “
Reset Filter|Xóa bộ lọc
Seasonal Recipes & Culinary Videos|Công thức theo mùa & video nấu ăn
Wholesome plant-forward culinary inspiration for home cooking|Cảm hứng nấu ăn thực vật lành mạnh cho căn bếp gia đình
Rooted in mindful balance|Hướng đến sự cân bằng
📹 Video|📹 Video
📖 Recipe|📖 Công thức
By|Bởi
Close modal|Đóng hộp thoại
reviews)|đánh giá)
📍 Address:|📍 Địa chỉ:
⏰ Hours:|⏰ Giờ mở cửa:
💰 Price:|💰 Giá:
📞 Hotline:|📞 Điện thoại:
Signature Dishes & Recommendations|Món đặc trưng & gợi ý
Saved in Bookmarks|Đã lưu
Save Place|Lưu địa điểm
Reserve Table / Call|Đặt bàn / gọi điện
All|Tất cả
Showing|Hiển thị
recipes|công thức
restaurants|nhà hàng
Personal Sanctuary|Góc riêng của bạn
Saved Content ·|Nội dung đã lưu ·
My Collection|Bộ sưu tập của tôi
Your bookmarked recipes and restaurant reviews in one place.|Công thức và đánh giá nhà hàng bạn đã lưu trong cùng một nơi.
Sort:|Sắp xếp:
Recently Bookmarked|Mới lưu gần đây
Highest Rated|Đánh giá cao nhất
Title Alphabetical|Tên theo bảng chữ cái
All (|Tất cả (
Video & Recipes (|Video & công thức (
Restaurant Reviews (|Đánh giá nhà hàng (
Tap bookmark flag on any card to remove from personal box|Nhấn biểu tượng lưu trên thẻ để bỏ khỏi bộ sưu tập
Nothing saved yet|Chưa có mục nào được lưu
Explore vegan recipes or your favorite restaurants and bookmark them for your collection.|Khám phá các công thức nấu ăn thuần chay hoặc nhà hàng yêu thích và nhấn lưu lại để đưa vào bộ sưu tập cá nhân.
Explore recipes now|Khám phá công thức ngay
Remove bookmark|Bỏ lưu bookmark
Save bookmark|Lưu bookmark
Bookmarked|Đã lưu
Removed|Đã bỏ lưu
Saved Recipes|Công thức đã lưu
Bookmarked Places|Địa điểm đã lưu
bistros|nhà hàng
Primary Cuisine|Ẩm thực chính
Vietnamese Chay|Món chay Việt Nam
Pantry Readiness|Nguyên liệu sẵn có
VeggieAI Meal Assistant|Trợ lý bữa ăn VeggieAI
Your saved recipes can help VeggieMate build your weekly meal plan.|Các công thức đã lưu giúp VeggieMate lên thực đơn hàng tuần cho bạn.
Plan My Week|Lên thực đơn tuần
items|mục
Welcome to VeggieMate|Chào mừng đến VeggieMate
Sign in to save recipes, join mindful discussions, and access personalized plant-based nutrition.|Đăng nhập để lưu công thức, tham gia thảo luận và nhận gợi ý dinh dưỡng thực vật phù hợp.
Email verified successfully. Please log in.|Xác minh email thành công. Vui lòng đăng nhập.
Your account is active. Enter your password to log in.|Tài khoản của bạn đã được kích hoạt thành công. Hãy nhập mật khẩu để đăng nhập.
Dismiss notification|Đóng thông báo
Signed in:|Đã đăng nhập:
No account yet?|Chưa có tài khoản?
Create an account now|Đăng ký tài khoản mới ngay
Go to OTP verification|Chuyển tới xác thực OTP
Connecting to Google...|Đang kết nối Google...
Continue with Google|Tiếp tục với Google
or|hoặc
OR|HOẶC
Email address|Địa chỉ email
Password|Mật khẩu
Forgot password?|Quên mật khẩu?
Hide password|Ẩn mật khẩu
Show password|Hiện mật khẩu
Signing in...|Đang đăng nhập...
Log In|Đăng nhập
Don't have an account?|Bạn chưa có tài khoản?
Create New Account|Tạo tài khoản mới
By continuing, you agree to VeggieMate's|Khi tiếp tục, bạn đồng ý với
Terms of Service|Điều khoản sử dụng
and|và
Privacy Policy|Chính sách bảo mật
Create an account to save recipes, join mindful discussions, and access personalized plant-based nutrition.|Tạo tài khoản để lưu công thức, tham gia thảo luận và nhận gợi ý dinh dưỡng thực vật phù hợp.
Already have an account with this email?|Bạn đã có tài khoản với email này?
Log in here|Đăng nhập tại đây
Full Name|Họ và tên
Your full name|Họ và tên của bạn
Enter your email|Nhập email của bạn
Enter your password (min 6 characters)|Nhập mật khẩu (tối thiểu 6 ký tự)
Confirm Password|Xác nhận mật khẩu
Confirm your password|Nhập lại mật khẩu
Registering...|Đang xử lý đăng ký...
Create Account|Tạo tài khoản
Already have an account?|Bạn đã có tài khoản?
Missing verification information|Thiếu thông tin xác thực
No email is awaiting verification. Please register or log in.|Không tìm thấy địa chỉ email đang chờ xác minh OTP. Vui lòng thực hiện đăng ký hoặc đăng nhập.
Go to registration|Đến trang Đăng ký
Go to login|Đến trang Đăng nhập
Verify your email|Xác minh email của bạn
We have sent a 6-digit verification code to|Chúng tôi đã gửi mã xác minh 6 chữ số đến
Enter 6-digit Code|Nhập mã 6 chữ số
Verifying code...|Đang xác thực mã...
Verify Email|Xác minh email
Resending...|Đang gửi lại...
Resend OTP in|Gửi lại OTP sau
Resend OTP|Gửi lại OTP
← Back to login|← Về trang đăng nhập
Loading profile…|Đang tải hồ sơ…
Dismiss|Đóng
Account & Preferences|Tài khoản & tùy chọn
My Profile|Hồ sơ của tôi
Manage your personal information, health details and living location to shape your seasonal table.|Quản lý thông tin cá nhân, sức khỏe và nơi sinh sống để nhận gợi ý bữa ăn phù hợp.
Your Name|Tên của bạn
Avatar upload is not supported by the backend yet|Máy chủ chưa hỗ trợ tải ảnh đại diện
Change Photo|Đổi ảnh
Personal Information|Thông tin cá nhân
Used for recipe discussions, workshop confirmations, and community identity.|Dùng trong thảo luận công thức, xác nhận hoạt động và nhận diện thành viên.
Email Address|Địa chỉ email
Email cannot be changed|Không thể đổi email
Gender|Giới tính
Male|Nam
Female|Nữ
Not specified|Chưa xác định
Health Profile|Hồ sơ sức khỏe
Configures ingredient substitutions and nutrient balance in seasonal menus.|Giúp gợi ý nguyên liệu thay thế và cân bằng dinh dưỡng trong thực đơn.
Height|Chiều cao
Weight|Cân nặng
Vegetarian Diet Type|Chế độ ăn chay
Select diet type|Chọn chế độ ăn
Used to match recipes and personalize your meal plan.|Dùng để chọn công thức phù hợp và cá nhân hóa thực đơn.
Enter valid height and weight to compute BMI.|Nhập chiều cao và cân nặng hợp lệ để tính BMI.
Optimal Balance|Cân bằng tối ưu
Allergies & Intolerances|Dị ứng & không dung nạp
VeggieMate will flag or automatically omit dishes featuring these elements.|VeggieMate sẽ cảnh báo hoặc bỏ qua món có các thành phần này.
Add Allergy|Thêm dị ứng
No allergens available|Chưa có thông tin chất gây dị ứng
Note: Province/area selections are used to find coordinates only — the backend does not store address text.|Lưu ý: Tỉnh/khu vực chỉ dùng để tìm tọa độ; máy chủ không lưu địa chỉ dạng chữ.
Search Address|Tìm địa chỉ
Type to search for an address…|Nhập để tìm địa chỉ…
Selected coordinates:|Tọa độ đã chọn:
your area|khu vực của bạn
Cancel|Hủy
Saving…|Đang lưu…
Save Changes|Lưu thay đổi
Active radius: 5.0 km around|Bán kính: 5 km quanh
No result|Không có kết quả
House number, street, ward|Số nhà, tên đường, phường/xã
Featured Botanical Kitchens|Những căn bếp chay nổi bật
Curated Vegan Places in Saigon|Địa điểm chay chọn lọc tại Sài Gòn
Curated serene kitchens celebrated for mindful ingredients and culinary depth.|Những căn bếp thanh bình với nguyên liệu được chăm chút và hương vị phong phú.
Curated Tables|Địa điểm chọn lọc
100% Vegan|100% thuần chay
“To sit at a plant-forward table is to honor the earth, the seasons, and the gentle pace of life.”|“Một bữa ăn thực vật là cách trân trọng đất trời, mùa vụ và nhịp sống nhẹ nhàng.”
VeggieMate City Guide · Saigon Edition|Cẩm nang VeggieMate · Sài Gòn
🚶 Proximity:|🚶 Khoảng cách:
Close|Đóng
Vegan places guide|Cẩm nang địa điểm chay
Find vegetarian places near you|Tìm địa điểm chay gần bạn
Discover vegan restaurants, cafés and places around your living area.|Khám phá nhà hàng, quán cà phê và địa điểm thuần chay dựa trên khu vực sinh sống của bạn.
Living Location|Nơi sinh sống
Your home base coordinates for organic markets, plant bistros, and localized seasonal harvest.|Vị trí của bạn giúp tìm chợ hữu cơ, nhà hàng chay và thực phẩm theo mùa ở gần.
Use current location|Dùng vị trí hiện tại
Your location helps VeggieMate recommend vegetarian places near you in the|Vị trí giúp VeggieMate gợi ý địa điểm chay gần bạn trong
Vegan Places Guide|Cẩm nang địa điểm chay
and filter neighborhood community dining tables.|và lọc địa điểm ăn uống trong khu vực.
Select province|Chọn tỉnh/thành
Select area|Chọn khu vực
Select province first|Chọn tỉnh/thành trước
Living Address|Địa chỉ sinh sống
Places nearby|Địa điểm gần đây
Within a maximum radius of 5 km|Trong bán kính tối đa 5 km
Searching for places…|Đang tìm địa điểm…
No vegetarian restaurants found within 5 km. Try another address.|Không tìm thấy nhà hàng chay thật trong bán kính 5 km quanh địa chỉ này. Hãy thử địa chỉ khác hoặc mở rộng dữ liệu nhà hàng trong DB/OpenStreetMap.
No ratings yet|Chưa có đánh giá
Chat history|Lịch sử hội thoại
New Chat|Trò chuyện mới
No conversations yet. Start a new chat!|Chưa có cuộc trò chuyện nào. Bấm "New Chat" để bắt đầu!
Guest mode|Chế độ khách
Guest sessions allow up to 5 messages. Sign in to save your chat history.|Bạn đang sử dụng phiên khách (tối đa 5 tin nhắn/phiên). Đăng nhập để lưu trữ toàn bộ lịch sử trò chuyện lâu dài!
Current guest chat|Hội thoại khách hiện tại
Sign in to save history|Đăng nhập để lưu lịch sử
Connected|Đã kết nối
Open chat history|Mở lịch sử trò chuyện
· Culinary & Nutrition Guide|· Trợ lý ẩm thực & dinh dưỡng
Active · Tailored to vegetarian nutrition|Đang hoạt động · Dinh dưỡng chay phù hợp
Remaining|Còn
guest questions|câu hỏi khách
Start a new chat|Tạo hội thoại mới
Connecting to VeggieAI...|Đang kết nối VeggieAI...
Hello! How can I help with your vegetarian meal?|Xin chào! Tôi có thể giúp gì cho bữa ăn chay của bạn?
Ask about nutrition, plant-based protein substitutions or a meal plan for your health goals.|Hỏi tôi về thành phần dinh dưỡng, gợi ý thay thế đạm thực vật, hoặc lên kế hoạch bữa ăn phù hợp với mục tiêu sức khỏe của bạn.
Suggested questions:|Gợi ý câu hỏi:
USER|BẠN
Related recipes:|Công thức liên quan:
Sources:|Nguồn:
VeggieAI is thinking|VeggieAI đang suy nghĩ
Unlock all features with a VeggieMate account|Mở khóa toàn bộ tính năng với tài khoản VeggieMate
You have reached the 5-message guest limit. Sign in or create a free account to continue and save your chat history.|Bạn đã đạt giới hạn 5 tin nhắn dành cho khách. Hãy đăng nhập hoặc đăng ký tài khoản miễn phí để tiếp tục trò chuyện không giới hạn, lưu lịch sử và nhận thực đơn cá nhân hóa!
Sign up|Đăng ký tài khoản
Please sign in to continue chatting...|Vui lòng đăng nhập để tiếp tục trò chuyện...
Ask VeggieAI about nutrition, substitutions, or recipes...|Hỏi VeggieAI về dinh dưỡng, nguyên liệu thay thế hoặc công thức...
Send message|Gửi tin nhắn
VeggieAI provides culinary and general nutritional guidance based on plant-based dietary recommendations.|VeggieAI cung cấp gợi ý ẩm thực và dinh dưỡng tổng quát theo chế độ ăn thực vật.
🥗 Related dishes:|🥗 Gợi ý món liên quan:
Week 14 · Autumn Nourishment Table|Tuần 14 · Bữa ăn dinh dưỡng mùa thu
A bespoke vegetarian harvest tailored to Minh's pantry, thoughtful routines, and curated recipe collection.|Thực đơn chay theo nguyên liệu, thói quen và bộ sưu tập công thức của Minh.
Regenerating...|Đang tạo lại...
Regenerate Plan|Tạo lại thực đơn
Print meal plan|In thực đơn
Intentional Eater · Hanoi Studio|Ăn uống lành mạnh · Hà Nội
Gentle Cut|Giảm cân nhẹ nhàng
Body Tempo|Nhịp cơ thể
Norm|Bình thường
Focus|Mục tiêu
Weight Loss|Giảm cân
AVOIDING ALLERGENS|TRÁNH CHẤT GÂY DỊ ỨNG
+ Add|+ Thêm
Allergen name...|Tên chất dị ứng...
Save|Lưu
Remove allergy|Gỡ dị ứng
12 Saved Recipes in Box|12 công thức đã lưu
Larder & Fresh Bin|Tủ bếp & nguyên liệu tươi
Used first to prevent culinary waste|Ưu tiên sử dụng để tránh lãng phí
Delete ingredient|Xóa nguyên liệu
Add pantry staple (e.g., Lemongrass)|Thêm nguyên liệu có sẵn (ví dụ: sả)
AI prioritizes these ingredients in Monday & Tuesday courses.|AI ưu tiên nguyên liệu này trong bữa ăn thứ Hai & thứ Ba.
Generate My 7-Day Plan|Tạo thực đơn 7 ngày
Pantry Utilization: 84%|Sử dụng nguyên liệu: 84%
By prioritizing your tofu and mushrooms within 48 hours, you avoid food waste while staying aligned with your light deficit.|Ưu tiên dùng đậu hũ và nấm trong 48 giờ để tránh lãng phí và giữ mức giảm năng lượng nhẹ.
Saved in Collection|Đã lưu vào bộ sưu tập
View Recipe|Xem công thức
Replace|Thay món
Wednesday|Thứ Tư
Day 3 · Clean Greens & Broths|Ngày 3 · Rau xanh & canh thanh nhẹ
3 Dishes Planned|Đã lên lịch 3 món
BREAKFAST · 15 MINS|BỮA SÁNG · 15 PHÚT
LUNCH · 20 MINS|BỮA TRƯA · 20 PHÚT
DINNER · 30 MINS|BỮA TỐI · 30 PHÚT
BREAKFAST|BỮA SÁNG
LUNCH|BỮA TRƯA
DINNER|BỮA TỐI
Morning|Buổi sáng
Midday|Buổi trưa
Evening|Buổi tối
15 mins|15 phút
20 mins|20 phút
30 mins|30 phút
Thursday – Sunday Overview|Tổng quan thứ Năm – Chủ nhật
4 Days Remaining|Còn 4 ngày
Thursday · Day 4|Thứ Năm · Ngày 4
Friday · Day 5|Thứ Sáu · Ngày 5
Saturday · Day 6|Thứ Bảy · Ngày 6
Sunday · Day 7|Chủ nhật · Ngày 7
🥗 Ingredients to prepare:|🥗 Nguyên liệu cần chuẩn bị:
🍳 Cooking instructions:|🍳 Hướng dẫn chế biến:
Admin Dashboard|Bảng quản trị
Content & Categories|Nội dung & danh mục
AI Flagged|AI cảnh báo
Members|Thành viên
🛠️ Admin Test|🛠️ Thử nghiệm quản trị
`.trim();

const extraCopy = `
Admin Area|Khu vực quản trị
Admin|Quản trị viên
Supervisor|Người giám sát
Search admin...|Tìm trong quản trị...
Editorial Desk|Góc biên tập
Content Management|Quản lý nội dung
Manage recipes, restaurant reviews, and community discourse.|Quản lý công thức, đánh giá nhà hàng và thảo luận cộng đồng.
Total Library|Tổng nội dung
Pending Moderation|Chờ kiểm duyệt
All Published Content|Tất cả nội dung đã đăng
Export CSV|Xuất CSV
Create Entry|Tạo nội dung
All (486)|Tất cả (486)
Video & Recipe|Video & công thức
Video & Recipes (312)|Video & công thức (312)
Restaurant Review|Đánh giá nhà hàng
Restaurant Reviews (174)|Đánh giá nhà hàng (174)
Search content by title or author...|Tìm nội dung theo tên hoặc tác giả...
Status: All|Trạng thái: Tất cả
Status: Published|Trạng thái: Đã đăng
Status: Draft|Trạng thái: Bản nháp
Refresh content list|Làm mới danh sách
Published Stories & Guides|Bài viết & hướng dẫn đã đăng
of 486 entries|trên 486 nội dung
TITLE & THUMBNAIL|TIÊU ĐỀ & ẢNH
TYPE|LOẠI
AUTHOR|TÁC GIẢ
STATUS|TRẠNG THÁI
No matching posts found.|Không tìm thấy bài viết phù hợp.
Published|Đã đăng
Draft|Bản nháp
Page 1 of 123|Trang 1 trên 123
Moderation Stream|Luồng kiểm duyệt
Hide moderation panel|Ẩn bảng kiểm duyệt
Comments on:|Bình luận trong:
Total Comments|Tổng bình luận
Live sync|Đồng bộ trực tiếp
• (Muted)|• (Đã tắt thông báo)
FILTER|BỘ LỌC
Flagged|Bị cảnh báo
Flagged (1)|Bị cảnh báo (1)
Hidden|Đã ẩn
No comments match this filter.|Không có bình luận nào theo bộ lọc này.
Unhide|Hiện lại
Hide|Ẩn
Remove|Xóa
Bulk Action:|Thao tác hàng loạt:
Unmute Thread|Bật thông báo luồng
Mute Thread|Tắt thông báo luồng
Approve All|Duyệt tất cả
Create Content Entry|Tạo nội dung mới
Post / review title|Tiêu đề bài viết / Review
e.g. Lotus Seed Seaweed Soup|e.g. Canh Rong Biển Hạt Sen
Subtitle / summary|Mô tả phụ / Thông tin tóm tắt
e.g. Nourishing soup • 20 minutes|e.g. Món canh dưỡng sinh • 20 phút
Format|Loại định dạng
Cuisine category|Phân loại ẩm thực
Author|Tác giả
Publication status|Trạng thái xuất bản
Published (Public)|Published (Công khai)
Draft (Unpublished)|Draft (Bản nháp)
Image URL|URL Ảnh minh họa
Cancel|Hủy bỏ
Save post|Lưu bài viết
EDITORIAL MODERATION|KIỂM DUYỆT BIÊN TẬP
Pending Review|Chờ duyệt
Pending Reviews|Nội dung chờ duyệt
AI Flagged Content|Nội dung AI cảnh báo
Review content flagged by VeggieAI before moderation. Administrator makes the final decision.|Kiểm tra nội dung VeggieAI cảnh báo. Quản trị viên quyết định xử lý cuối cùng.
Calm Guardian Active|Giám sát đang hoạt động
Non-intrusive safety stream|Giám sát an toàn nhẹ nhàng
Community Care Note|Lưu ý cho cộng đồng
VeggieAI identifies potential issues such as misleading ingredient claims or reported text. Content remains online until reviewed.|VeggieAI nhận diện thông tin nguyên liệu sai lệch hoặc nội dung bị báo cáo. Nội dung vẫn hiển thị đến khi được duyệt.
Average decision time: 4m|Thời gian xử lý trung bình: 4 phút
Content|Nội dung
Content (|Nội dung (
Comments|Bình luận
Comments (|Bình luận (
Search flagged content, authors, or reasons...|Tìm nội dung cảnh báo, tác giả hoặc lý do...
Filter|Lọc
Comment|Bình luận
FLAGGED ITEM — COMMENT|BÌNH LUẬN BỊ CẢNH BÁO
⏱ Flagged|⏱ Bị cảnh báo
Posted by|Đăng bởi
Submitted by|Gửi bởi
Flag Reason|Lý do cảnh báo
View Full Context|Xem ngữ cảnh đầy đủ
View Content|Xem nội dung
Keep (Dismiss Flag)|Giữ lại (bỏ cảnh báo)
Remove Content|Xóa nội dung
No flagged content awaiting review|Không có nội dung cắm cờ đang chờ duyệt
All community alerts and reports in this section have been handled. VeggieAI continues monitoring.|Tất cả các cảnh báo hoặc báo cáo từ cộng đồng trong mục này đã được xử lý. Hệ thống VeggieAI đang tiếp tục giám sát theo thời gian thực.
Restore sample data (12 items)|Khôi phục lại dữ liệu mẫu (12 nội dung)
Displaying|Đang hiển thị
of|trên
flagged items awaiting administrator review|nội dung cảnh báo chờ quản trị viên duyệt
Previous|Trước
Next|Tiếp
Authenticating Administrator privileges...|Đang kiểm tra quyền quản trị...
ADMIN|QUẢN TRỊ
Dev Bypass Active|Chế độ phát triển đang bỏ qua kiểm tra quyền
Log Out|Đăng xuất
DIRECTORY|DANH BẠ
COMMUNITY ROSTER|DANH SÁCH CỘNG ĐỒNG
Manage registered VeggieMate community members, monitor flags, and audit contributions.|Quản lý thành viên VeggieMate, theo dõi cảnh báo và kiểm tra đóng góp.
Search members by name or email...|Tìm thành viên theo tên hoặc email...
Active|Đang hoạt động
Suspended|Đã khóa
Filter members by status|Lọc thành viên theo trạng thái
Status: All Statuses|Trạng thái: Tất cả
Status: Active|Trạng thái: Hoạt động
Status: Suspended|Trạng thái: Đã khóa
Joined Date: Newest|Ngày tham gia: Mới nhất
Export Members|Xuất danh sách thành viên
MEMBER|THÀNH VIÊN
EMAIL|EMAIL
JOINED|NGÀY THAM GIA
VIEWING|ĐANG XEM
Member|Thành viên
• Flagged|• Bị cảnh báo
members|thành viên
Member Profile|Hồ sơ thành viên
Account Status:|Trạng thái tài khoản:
Joined|Tham gia
COMMUNITY ACTIVITY|HOẠT ĐỘNG CỘNG ĐỒNG
Last active|Hoạt động gần nhất
Posts|Bài viết
Videos|Video
Reviews|Đánh giá
% Helpful|% hữu ích
Saved|Đã lưu
In Recipe Box|Trong bộ sưu tập
30-Day Contribution Cadence|Đóng góp trong 30 ngày
Member Privacy Guarded|Bảo vệ riêng tư thành viên
Admin view strictly omits private biometric data and physical addresses.|Giao diện quản trị không hiển thị dữ liệu sinh trắc học riêng tư hoặc địa chỉ cụ thể.
Send Notification / Email|Gửi thông báo / email
Suspend Member|Khóa thành viên
OVERVIEW & MODERATION|TỔNG QUAN & KIỂM DUYỆT
Administration|Quản trị hệ thống
Keep the VeggieMate community healthy and organized.|Giữ cộng đồng VeggieMate lành mạnh và có tổ chức.
System Operational · Editorial Edition|Hệ thống hoạt động · Phiên bản biên tập
Preferences|Tùy chọn
MEMBERS|THÀNH VIÊN
Registered members|Thành viên đã đăng ký
CONTENT|NỘI DUNG
Published recipes & reviews|Công thức & đánh giá đã đăng
NEEDS REVIEW|CẦN DUYỆT
Priority|Ưu tiên
Items needing review|Nội dung cần duyệt
DISCOURSE|THẢO LUẬN
Total community comments|Tổng bình luận cộng đồng
Recent Activity|Hoạt động gần đây
View ledger|Xem nhật ký
Moderation Attention|Cần kiểm duyệt
Pending|Đang chờ
items need review|nội dung cần duyệt
VeggieAI has flagged content for administrator review to protect ingredient authenticity and respectful dialogue.|VeggieAI cảnh báo nội dung cần duyệt để đảm bảo thông tin nguyên liệu chính xác và thảo luận tôn trọng.
PENDING DECISION QUEUE|HÀNG CHỜ XỬ LÝ
Community Recipes|Công thức cộng đồng
Comments & Discussions|Bình luận & thảo luận
Review Flagged Content|Duyệt nội dung cảnh báo
Recent Content|Nội dung gần đây
Submissions awaiting audit, curation, or seasonal promotion.|Nội dung chờ kiểm tra, tuyển chọn hoặc giới thiệu theo mùa.
All Formats|Tất cả định dạng
Export Log|Xuất nhật ký
TITLE|TIÊU ĐỀ
DATE|NGÀY
ACTIONS|THAO TÁC
View|Xem
Displaying 4 of 486 registered community entries|Hiển thị 4 trên 486 nội dung cộng đồng
“A mindful culinary collective flourishes when seasonal nourishment meets gracious hospitality.” — Editorial Guidelines, Autumn 2026|“Cộng đồng ẩm thực phát triển khi dinh dưỡng theo mùa đi cùng sự hiếu khách.” — Hướng dẫn biên tập, mùa thu 2026
Read Handbook|Đọc hướng dẫn
VeggieAI automatically selects from your favorite bookmarked dishes and seasonal pantry ingredients to generate a balanced 7-day vegetarian menu.|VeggieAI chọn từ món đã lưu và nguyên liệu theo mùa để tạo thực đơn chay 7 ngày cân bằng.
Takes ~30 seconds · Synchronized with your pantry stock|Khoảng 30 giây · Đồng bộ với nguyên liệu có sẵn
Toasted Sourdough with Edamame Herb Mash|Bánh mì nướng với đậu nành Nhật nghiền
Lemony crushed green soybeans, olive oil, and toasted coriander seeds.|Đậu nành xanh nghiền với chanh, dầu ô liu và hạt ngò rang.
Garlic Bok Choy & Glass Noodle Tangle|Miến xào cải thìa và tỏi
Wok-tossed farm greens with ginger, light tamari, and roasted sesame.|Rau xanh xào với gừng, nước tương nhạt và mè rang.
Kabocha Pumpkin & Coconut Gentle Curry|Cà ri bí đỏ nước cốt dừa
Sweet squash simmered with light coconut nectar, turmeric, and crisp long beans.|Bí đỏ ngọt nấu với nước cốt dừa, nghệ và đậu đũa giòn.
Braised Tofu with Lemongrass & Chili|Đậu hũ kho sả ớt
Vietnamese Sweet & Sour Tamarind Soup|Canh chua me chay
Mushroom & Green Herb Rice Pot|Cơm nấm và rau thơm
Family Feast: Mushroom Hotpot Table|Bữa cơm gia đình: Lẩu nấm
Search province...|Tìm tỉnh/thành...
Search district / area...|Tìm quận/huyện, khu vực...
Search ward / commune...|Tìm phường/xã...
New|Mới
Lacto-Ovo Vegetarian|Chay có trứng & sữa
Lacto Vegetarian|Chay có sữa
Ovo Vegetarian|Chay có trứng
Flexitarian|Chay linh hoạt
Soy|Đậu nành
Peanuts|Đậu phộng
Milk|Sữa
Eggs|Trứng
Gluten|Gluten
Tree nuts|Hạt cây
Sesame|Mè
Underweight|Thiếu cân
Normal|Bình thường
Overweight|Thừa cân
Obese|Béo phì
Full name is required.|Họ và tên là bắt buộc.
Enter a positive number.|Nhập số lớn hơn 0.
Please log in to view your profile.|Vui lòng đăng nhập để xem hồ sơ.
Session expired. Please log in again to load your profile.|Phiên đã hết hạn. Đăng nhập lại để tải hồ sơ.
Failed to load profile. Please try again.|Không tải được hồ sơ. Vui lòng thử lại.
Could not find coordinates for this area. Try typing a detailed address.|Không tìm thấy tọa độ khu vực. Hãy nhập địa chỉ chi tiết.
Please select a valid image file (JPG, PNG, GIF, WEBP).|Chọn tệp ảnh hợp lệ (JPG, PNG, GIF, WEBP).
Profile updated successfully.|Đã cập nhật hồ sơ.
Something went wrong. Your changes were not saved.|Có lỗi xảy ra. Các thay đổi chưa được lưu.
Google sign-in failed. Please try again.|Đăng nhập Google không thành công. Vui lòng thử lại.
Enter your email and password.|Vui lòng nhập đầy đủ email và mật khẩu.
Incorrect email or password. Register first if you do not have an account.|Email hoặc mật khẩu không đúng. Nếu chưa có tài khoản, vui lòng đăng ký trước khi đăng nhập.
Your email is not verified. Verify the OTP to continue.|Tài khoản của bạn chưa được xác thực email. Vui lòng xác thực mã OTP để tiếp tục.
Your account is disabled. Contact an administrator.|Tài khoản của bạn hiện đang bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.
This account does not have access.|Tài khoản không có quyền truy cập.
Sign-in failed. Please try again.|Đăng nhập không thành công. Vui lòng thử lại.
Enter your full name.|Vui lòng nhập họ và tên.
Full name cannot exceed 150 characters.|Họ và tên không được vượt quá 150 ký tự.
Enter your email address.|Vui lòng nhập địa chỉ email.
Invalid email address.|Địa chỉ email không hợp lệ.
Password must be at least 6 characters.|Mật khẩu phải có tối thiểu 6 ký tự.
Passwords do not match.|Mật khẩu xác nhận không khớp.
This email is already registered.|Email này đã được đăng ký tài khoản.
Registration failed. Check your connection or try again later.|Đăng ký không thành công. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.
No email to verify. Please register again.|Không tìm thấy email cần xác thực. Vui lòng đăng ký lại.
Enter all 6 OTP digits.|Vui lòng nhập đầy đủ mã OTP 6 chữ số.
This email has already been verified.|Email này đã được xác thực trước đó.
OTP verification failed. Please try again.|Xác thực OTP thất bại. Vui lòng thử lại.
A new OTP has been sent to your email.|Mã OTP mới đã được gửi tới email của bạn.
You requested codes too quickly. Please wait a moment.|Bạn đã yêu cầu gửi mã quá nhanh. Vui lòng đợi trong giây lát.
No verification request found for this email. Please register again.|Không tìm thấy yêu cầu xác thực cho email này. Vui lòng đăng ký lại.
Could not resend the OTP. Please try again later.|Không thể gửi lại mã OTP. Vui lòng thử lại sau.
Could not start chat|Không thể khởi tạo phiên trò chuyện
Could not load conversation|Không thể tải hội thoại
Could not create a new chat|Không thể tạo hội thoại mới
Messages cannot exceed 1000 characters.|Nội dung tin nhắn tối đa 1000 ký tự.
No response received from AI.|Không nhận được phản hồi từ AI.
Could not send your message. Please try again.|Lỗi khi gửi tin nhắn. Vui lòng thử lại.
Does tofu provide enough protein for dinner after a workout?|Đậu hũ có đủ đạm cho bữa tối sau tập gym không?
Build a balanced 7-day vegetarian meal plan|Lên thực đơn ăn chay 7 ngày cân bằng dinh dưỡng
Vegetarian dishes rich in calcium and iron for beginners|Các món chay giàu canxi và sắt cho người mới bắt đầu
`.trim();

const mealCopy = `
Could not save the video draft|Lỗi lưu bản nháp video
TODAY|HÔM NAY
YESTERDAY|HÔM QUA
PREVIOUS 7 DAYS|7 NGÀY TRƯỚC
OLDER|CŨ HƠN
New conversation|Cuộc trò chuyện mới
VeggieAI has regenerated your 7-day meal plan based on your ingredients!|VeggieAI đã lên lại kế hoạch thực đơn 7 ngày dựa trên nguyên liệu của bạn!
Wednesday dish replaced!|Đã đổi món thứ 4!
Monday|Thứ Hai
Tuesday|Thứ Ba
Day 1 · Fresh Larder Start|Ngày 1 · Nguyên liệu tươi đầu tuần
Day 2 · Earth & Claypot|Ngày 2 · Món kho niêu
Warm Tofu & Vegetable Congee|Cháo đậu hũ và rau củ
Gentle broken rice infused with shaved fresh ginger, bok choy stems, and silken tofu cubs seasoned with white pepper.|Cháo gạo tấm với gừng, cải thìa, đậu hũ non và tiêu trắng.
150g Broken jasmine rice|150 g gạo tấm
100g Silken tofu|100 g đậu hũ non
2 stalks Baby bok choy|2 nhánh cải thìa
1 tsp Shaved fresh ginger|1 thìa cà phê gừng thái sợi
Sesame oil & white pepper|Dầu mè & tiêu trắng
Simmer jasmine rice with vegetable stock until broken and velvety.|Nấu gạo với nước dùng rau củ đến khi mềm mịn.
Add diced silken tofu and sliced bok choy stems.|Thêm đậu hũ non cắt vuông và cải thìa thái nhỏ.
Finish with ginger shreds, toasted sesame oil, and cilantro.|Thêm gừng sợi, dầu mè và ngò rí.
Bún Bò Chay (Spicy Hue Broth)|Bún bò chay Huế
Lemongrass simmered root broth with thick round rice noodles, king oyster mushrooms, and crispy tofu puffs.|Nước dùng rau củ thơm sả ăn với bún, nấm đùi gà và đậu hũ chiên.
200g Fresh thick rice noodles|200 g bún tươi sợi lớn
3 stalks Lemongrass|3 cây sả
100g King oyster mushrooms|100 g nấm đùi gà
50g Fried tofu puffs|50 g đậu hũ chiên
Annatto oil, lime & fresh mint|Dầu điều, chanh & rau thơm
Bruise lemongrass stalks and simmer with daikon and pineapple core.|Đập dập sả, nấu cùng củ cải và lõi dứa.
Stir-fry king oyster mushrooms with annatto chili oil.|Xào nấm đùi gà với dầu điều và ớt.
Pour boiling broth over noodles and garnish with herbs.|Chan nước dùng nóng vào bún và thêm rau thơm.
Easy Tofu in Rich Tomato Sauce|Đậu hũ sốt cà chua
Quick pantry pan-fry with crushed vine tomatoes, finely sliced scallions, and warm steamed brown rice.|Đậu hũ áp chảo với sốt cà chua, hành lá và cơm gạo lứt nóng.
300g Firm organic tofu|300 g đậu hũ hữu cơ
3 Ripe vine tomatoes|3 quả cà chua chín
2 Scallions|2 nhánh hành lá
1 tbsp Tamari soy sauce|1 thìa canh nước tương tamari
1 tsp Cane sugar|1 thìa cà phê đường mía
Pan-fry cubed tofu until light golden edges form.|Áp chảo đậu hũ cắt vuông đến khi vàng nhẹ.
Simmer diced tomatoes into a velvety reduction with tamari.|Nấu cà chua thái nhỏ với tamari đến khi sốt sánh.
Toss tofu in tomato sauce and garnish with scallions.|Đảo đậu hũ trong sốt cà chua và rắc hành lá.
Avocado & Steamed Rice Paper Rolls|Gỏi cuốn bơ
Crisp mint leaves, julienned cucumber, creamy hass avocado with lightly seasoned peanut dipping sauce.|Rau thơm, dưa leo thái sợi và bơ béo mềm ăn cùng sốt đậu phộng.
6 Sheets Vietnamese rice paper|6 tờ bánh tráng
1 Ripe Hass avocado|1 quả bơ chín
1 Persian cucumber|1 quả dưa leo
Fresh mint & perilla leaves|Rau thơm & tía tô
Peanut hoisin dip|Sốt tương đậu phộng
Dip rice paper briefly in lukewarm water.|Nhúng nhanh bánh tráng vào nước ấm.
Layer avocado slices, cucumber strips, and fresh herbs.|Xếp bơ, dưa leo và rau thơm.
Roll tightly and serve immediately with peanut sauce.|Cuốn chặt tay, dùng ngay cùng sốt đậu phộng.
Claypot Braised Tofu & Eggplant|Đậu hũ và cà tím kho niêu
Slow-caramelized Asian eggplant with cracked Kampot black pepper, garlic scallions, and silken claypot glaze.|Cà tím kho chậm cùng tiêu đen, hành tỏi và nước sốt sánh.
2 Asian purple eggplants|2 quả cà tím
200g Fried firm tofu|200 g đậu hũ chiên
2 tbsp Dark mushroom soy sauce|2 thìa canh nước tương nấm
1 tsp Coarse black pepper|1 thìa cà phê tiêu đen
1 Red chili|1 quả ớt đỏ
Sear eggplant slices in claypot until slightly charred.|Áp chảo cà tím trong niêu đến khi xém nhẹ.
Add tofu, caramelized mushroom soy sauce, and 1/2 cup water.|Thêm đậu hũ, nước tương nấm và nửa cốc nước.
Simmer on low heat until sauce thickens and glazes eggplant.|Kho nhỏ lửa đến khi sốt sánh và thấm vào cà tím.
Crispy Mushroom Spring Rolls with Vermicelli|Bún chả giò nấm
Shiitake and wood-ear mushroom filling served over chilled vermicelli noodles, fresh garden herbs, and lime dressing.|Chả giò nhân nấm hương, mộc nhĩ ăn cùng bún, rau thơm và nước chấm chanh.
10 Crispy spring roll wrappers|10 tờ bánh tráng chả giò
100g Fresh shiitake & wood ear mushrooms|100 g nấm hương & mộc nhĩ
150g Rice vermicelli|150 g bún
Fresh lettuce & herbs|Xà lách & rau thơm
Sweet & sour lime dipping dressing|Nước chấm chanh chua ngọt
Roll mushroom filling in wrappers and air fry at 190°C for 12 mins.|Cuốn nhân nấm, chiên không dầu ở 190°C trong 12 phút.
Cook rice vermicelli and drain in cold water.|Luộc bún, xả nước lạnh và để ráo.
Assemble rolls over vermicelli bed and drizzle dressing.|Xếp chả giò lên bún và rưới nước chấm.
Lemony crushed green soybeans, extra virgin olive oil, and toasted coriander seeds.|Đậu nành xanh nghiền với chanh, dầu ô liu và hạt ngò rang.
Wok-tossed farm greens with ginger, light tamari, and toasted sesame crunch.|Rau xanh xào với gừng, tamari nhạt và mè rang giòn.
Egg White|Lòng trắng trứng
Pressed Tofu|Đậu hũ ép
Vine Tomatoes|Cà chua
King Oyster Mushrooms|Nấm đùi gà
Baby Bok Choy|Cải thìa
Lemony crushed green soybeans with herbs.|Đậu nành xanh nghiền với chanh và rau thơm.
2 Slices sourdough|2 lát bánh mì lên men
100g Shelled edamame|100 g đậu nành Nhật bóc vỏ
Fresh mint, lemon juice|Rau thơm, nước chanh
Toast sourdough.|Nướng bánh mì.
Mash warm edamame with lemon & oil.|Nghiền đậu nành ấm với chanh và dầu.
Spread and garnish.|Phết lên bánh mì và trang trí.
Wok-tossed greens with glass noodles.|Rau xanh xào miến.
100g Glass noodles|100 g miến
3 Bok choy heads|3 cây cải thìa
Minced garlic|Tỏi băm
Soak glass noodles.|Ngâm miến.
Wok fry garlic & bok choy.|Xào tỏi và cải thìa.
Toss noodles together.|Cho miến vào đảo đều.
Sweet squash curry with coconut milk.|Cà ri bí đỏ nước cốt dừa.
300g Kabocha pumpkin|300 g bí đỏ
200ml Coconut milk|200 ml nước cốt dừa
Turmeric, long beans|Nghệ, đậu đũa
Cube and steam pumpkin.|Cắt bí đỏ thành miếng vuông và hấp.
Simmer with curry paste and coconut milk.|Nấu nhỏ lửa với sốt cà ri và nước cốt dừa.
Add long beans.|Thêm đậu đũa.
Recipe published successfully.|Công thức đã được đăng thành công.
English (EN)|Tiếng Anh (EN)
Blog|Bài chia sẻ
Recipe|Công thức
Select a ward or enter an address in the new province.|Hãy chọn phường/xã hoặc nhập địa chỉ tại tỉnh/thành mới.
Area was not found.|Không tìm thấy khu vực.
Area center is unavailable. You can enter a detailed address.|Chưa xác định được tâm khu vực này; bạn vẫn có thể nhập địa chỉ chi tiết.
Enter your living address.|Vui lòng nhập địa chỉ sinh sống.
Address was not found.|Không tìm thấy địa chỉ.
Nearby vegetarian places updated.|Đã cập nhật các địa điểm chay gần địa chỉ này.
Address not found. Add a house number, street or ward.|Không tìm thấy địa chỉ. Hãy nhập thêm số nhà, tên đường hoặc phường/xã.
Address selected and nearby places updated.|Đã chọn địa chỉ và cập nhật các địa điểm gần đó.
Finding the address on the map…|Đang xác định địa chỉ trên bản đồ…
Coordinates selected, but no address found.|Đã chọn tọa độ nhưng chưa tìm được địa chỉ.
Map location updated.|Đã cập nhật vị trí được chọn trên bản đồ.
Your browser does not support geolocation.|Trình duyệt này không hỗ trợ định vị.
Your current location is in use.|Đã dùng vị trí hiện tại của bạn.
Could not access your location. Allow browser location permission.|Không thể truy cập vị trí. Hãy cấp quyền định vị cho trình duyệt.
Google Maps is not configured|Google Maps chưa được cấu hình
Add|Thêm
to|vào file
to enable the interactive map.|để bật bản đồ tương tác.
vegetarian places|địa điểm chay
vegetarian places within 5 km|địa điểm chay trong 5km
`.trim();

const catalog = new Map<string, readonly [string, string]>();
for (const line of `${copy}\n${extraCopy}\n${mealCopy}`.split("\n")) {
  const [en, vi] = line.split("|");
  if (!en || !vi) continue;
  catalog.set(en, [en, vi]);
  catalog.set(vi, [en, vi]);
}

export function translateUi(text: string, language: Language): string {
  const entry = catalog.get(text);
  if (entry) return entry[language === "vi" ? 1 : 0];
  if (language === "vi") {
    if (/^\d+ mins?(?: · \d+ kcal)?$/.test(text)) return text.replace(/mins?/, "phút");
    if (/^\d+ min total prep$/.test(text)) return text.replace("min total prep", "phút chuẩn bị");
  }
  if (language === "en") {
    const messages: [RegExp, (match: RegExpMatchArray) => string][] = [
      [/^Đã gỡ dị ứng "(.*)"\.$/, m => `Removed allergy "${m[1]}".`],
      [/^Đã thêm dị ứng "(.*)"\.$/, m => `Added allergy "${m[1]}".`],
      [/^Đã bỏ nguyên liệu "(.*)"\.$/, m => `Removed ingredient "${m[1]}".`],
      [/^Đã thêm "(.*)" vào kho nguyên liệu!$/, m => `Added "${m[1]}" to your pantry!`],
      [/^Đã đổi món ăn bữa (BREAKFAST|LUNCH|DINNER) thành "(.*)"!$/, m => `Replaced ${m[1].toLowerCase()} with "${translateUi(m[2], language)}"!`],
      [/^Đã xác định vị trí (.*) trên bản đồ\.$/, m => `Located ${m[1]} on the map.`],
    ];
    for (const [pattern, format] of messages) {
      const match = text.match(pattern);
      if (match) return format(match);
    }
  }
  return text;
}

export function hasUiTranslation(text: string): boolean {
  return catalog.has(text);
}
