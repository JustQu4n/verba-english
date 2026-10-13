import type { Category, Level, SentencePrompt } from "../domain/sentence-catalog";

/**
 * Sample content: Vietnamese source sentences with English key words as hints. This is data, not UI text,
 * so it stays out of the message files. It is a stand-in until prompts are read from the database.
 */
const BANK: Record<Category, readonly [string, string][]> = {
  "personal-communication": [
    ["Tôi muốn giới thiệu bạn của tôi.", "introduce, friend"],
    ["Bạn có thể gửi lại tin nhắn cho tôi trước buổi tối được không?", "resend, message, before evening"],
    ["Dù đã giải thích nhiều lần, anh ấy vẫn hiểu sai ý của tôi.", "despite, explain, misunderstand, intention"],
  ],
  "everyday-life": [
    ["Sáng nào tôi cũng dậy lúc sáu giờ.", "wake up, every morning"],
    ["Tôi thường dành cuối tuần để dọn dẹp nhà cửa và nấu ăn cho cả tuần.", "spend, tidy up, meals for the week"],
    ["Giữ một thói quen đều đặn khó hơn nhiều so với việc bắt đầu nó.", "maintain, routine, consistent"],
  ],
  "transportation-travel": [
    ["Xe buýt đến trạm lúc tám giờ.", "bus, stop, arrive"],
    ["Chuyến bay của chúng tôi bị hoãn vì thời tiết xấu.", "flight, delay, bad weather"],
    ["Nếu tôi biết trước đường sẽ kẹt như vậy, tôi đã đi tàu điện ngầm.", "if I had known, traffic jam, subway"],
  ],
  "school-education": [
    ["Em gái tôi học lớp năm.", "younger sister, fifth grade"],
    ["Giáo viên yêu cầu chúng tôi nộp bài tập vào thứ Sáu.", "teacher, require, submit, assignment"],
    ["Giáo dục không chỉ truyền đạt kiến thức mà còn rèn luyện tư duy phản biện.", "not only, but also, convey, critical thinking"],
  ],
  "work-business": [
    ["Chị ấy làm việc trong một công ty nhỏ.", "work, company"],
    ["Chúng tôi cần hoàn thành báo cáo trước cuộc họp vào sáng mai.", "finish, report, meeting"],
    ["Công ty đang cân nhắc mở rộng thị trường để giảm sự phụ thuộc vào một khách hàng.", "consider, expand, market, reduce dependence"],
  ],
  "public-services": [
    ["Thư viện mở cửa lúc chín giờ.", "library, open"],
    ["Tôi phải xếp hàng hai tiếng để làm giấy tờ ở phường.", "queue, paperwork, local office"],
    ["Dịch vụ công trực tuyến giúp người dân tiết kiệm thời gian, nhưng cần đảm bảo ai cũng tiếp cận được.", "online public services, ensure, access, citizens"],
  ],
  "health-medicine": [
    ["Tôi bị đau đầu.", "have a headache"],
    ["Bác sĩ khuyên tôi nên ngủ đủ giấc và uống nhiều nước.", "advise, enough sleep, plenty of water"],
    ["Phòng bệnh luôn hiệu quả hơn và rẻ hơn so với chữa bệnh.", "prevention, effective, treatment"],
  ],
  "shopping-money": [
    ["Cái áo này giá bao nhiêu?", "how much, shirt"],
    ["Tôi đang cố tiết kiệm tiền để mua một chiếc laptop mới.", "save money, laptop"],
    ["Nhiều người tiêu dùng bị thuyết phục mua những thứ họ thật sự không cần.", "consumers, persuaded, actually need"],
  ],
  "food-drink": [
    ["Tôi thích ăn phở vào bữa sáng.", "like, pho, breakfast"],
    ["Món canh này hơi mặn, bạn có thể thêm chút nước không?", "soup, salty, add water"],
    ["Ẩm thực địa phương phản ánh lịch sử và khí hậu của cả một vùng.", "cuisine, reflect, climate, region"],
  ],
  "entertainment-leisure": [
    ["Chúng tôi xem phim vào tối thứ Bảy.", "watch a movie, Saturday evening"],
    ["Cuối tuần này bạn có muốn đi xem hòa nhạc với tôi không?", "concert, this weekend, would you like"],
    ["Thời gian rảnh được dùng tốt có thể giúp con người hồi phục và sáng tạo hơn.", "leisure time, recover, creative"],
  ],
  "nature-environment": [
    ["Hôm nay trời nắng và đẹp.", "sunny, beautiful"],
    ["Chúng ta nên giảm rác thải nhựa để bảo vệ biển.", "reduce, plastic waste, protect, ocean"],
    ["Biến đổi khí hậu đang đe dọa nhiều loài động vật đến mức tuyệt chủng.", "climate change, threaten, species, extinction"],
  ],
  "science-technology": [
    ["Điện thoại của tôi hết pin.", "phone, battery, run out"],
    ["Trí tuệ nhân tạo đang thay đổi cách chúng ta làm việc.", "artificial intelligence, change, the way"],
    ["Tiến bộ công nghệ chỉ thật sự có ích khi nó đi kèm trách nhiệm đạo đức.", "technological progress, beneficial, ethical responsibility"],
  ],
  "culture-society": [
    ["Tết là ngày lễ quan trọng nhất ở Việt Nam.", "Tet, holiday, important"],
    ["Ở nước tôi, người trẻ thường sống chung với cha mẹ cho đến khi lập gia đình.", "young people, live with parents, get married"],
    ["Sự khác biệt giữa các thế hệ có thể là nguồn xung đột, nhưng cũng là cơ hội để học hỏi.", "generational differences, conflict, opportunity"],
  ],
  "government-politics": [
    ["Thị trưởng sống ở thành phố này.", "mayor, city"],
    ["Công dân từ mười tám tuổi trở lên có quyền bỏ phiếu.", "citizens, aged eighteen, right to vote"],
    ["Một chính phủ minh bạch dễ nhận được sự tin tưởng của người dân hơn.", "transparent, government, public trust"],
  ],
  "history-geography": [
    ["Hà Nội là thủ đô của Việt Nam.", "capital"],
    ["Sông Mê Kông chảy qua nhiều quốc gia trước khi ra biển.", "Mekong River, flow through, countries, reach the sea"],
    ["Hiểu lịch sử giúp chúng ta tránh lặp lại những sai lầm của quá khứ.", "understanding history, avoid repeating, mistakes"],
  ],
  "sports-fitness": [
    ["Tôi chạy bộ mỗi buổi sáng.", "jog, every morning"],
    ["Đội của chúng tôi đã thắng trận đấu sau một hiệp phụ căng thẳng.", "team, win, match, extra time, tense"],
    ["Tập thể dục đều đặn không chỉ rèn luyện cơ thể mà còn cải thiện tinh thần.", "regular exercise, improve, mental health"],
  ],
  "arts-literature": [
    ["Tôi thích đọc truyện ngắn.", "short stories"],
    ["Bức tranh này làm tôi nhớ về tuổi thơ ở quê.", "painting, remind, childhood, hometown"],
    ["Một tác phẩm hay không đưa ra câu trả lời mà khiến người đọc đặt ra câu hỏi.", "work of art, provide answers, raise questions"],
  ],
  "religion-spirituality": [
    ["Gia đình tôi đi chùa vào ngày rằm.", "temple, full moon day"],
    ["Nhiều người tìm đến thiền để giảm căng thẳng và tìm sự bình yên.", "meditation, reduce stress, inner peace"],
    ["Tôn trọng tín ngưỡng của người khác là nền tảng của một xã hội hòa hợp.", "respect, beliefs, foundation, harmonious society"],
  ],
  "law-justice": [
    ["Chúng ta phải tuân theo luật.", "obey, law"],
    ["Người lái xe phải có bằng lái và bảo hiểm hợp lệ.", "driver, license, valid insurance"],
    ["Mọi người đều bình đẳng trước pháp luật, bất kể địa vị hay tài sản.", "equal before the law, regardless of, status, wealth"],
  ],
  "philosophy-ethics": [
    ["Nói thật là việc tốt.", "telling the truth, good"],
    ["Có lúc chúng ta phải chọn giữa điều đúng và điều dễ dàng.", "choose between, right, easy"],
    ["Liệu một hành động có thể được coi là đạo đức nếu nó chỉ xuất phát từ nỗi sợ bị trừng phạt?", "moral, stem from, fear of punishment"],
  ],
};

const LEVEL_ORDER: readonly Level[] = ["beginner", "intermediate", "advanced"];

export const SENTENCE_PROMPTS: readonly SentencePrompt[] = (Object.keys(BANK) as Category[]).flatMap((category) =>
  BANK[category].map(([vietnamese, hint], index) => {
    const level = LEVEL_ORDER[index];
    return { id: `${level}-${category}`, level, category, vietnamese, hint };
  })
);
