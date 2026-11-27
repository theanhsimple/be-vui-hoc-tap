/**
 * Parent-facing skill texts and the placement activity for the dev seed.
 *
 * DRAFT CONTENT — pending education review (DECISIONS P-4). These are
 * everyday play ideas, not curriculum claims, and say nothing about school
 * admission. Keyed by skill slug; seed.test.ts checks every skill has one.
 */

export interface SkillGuide {
  /** What the skill is about, in one plain sentence. */
  summary: string;
  /** A short activity a parent can do at home without materials to buy. */
  homeActivity: string;
}

export const SKILL_GUIDES: Record<string, SkillGuide> = {
  "af-s1": {
    summary: "Nhận ra hình dáng một số chữ cái quen thuộc.",
    homeActivity:
      "Cùng bé tìm chữ cái trên bao bì, biển hiệu khi đi đường, rồi đọc to tên chữ.",
  },
  "af-s2": {
    summary: "Nghe và nhận ra âm đầu của một tiếng.",
    homeActivity:
      "Chơi “tiếng gì bắt đầu bằng…”: bố mẹ nói một âm, bé kể tên đồ vật trong nhà có âm đó.",
  },
  "nk-s1": {
    summary: "Đếm số lượng đồ vật và nhận ra con số.",
    homeActivity:
      "Nhờ bé đếm số bát, số đũa khi dọn bữa, mỗi lần chạm vào một đồ vật.",
  },
  "nk-s2": {
    summary: "Nhận biết hình dạng và so sánh nhiều hơn, ít hơn.",
    homeActivity:
      "Tìm đồ vật hình tròn, hình vuông trong nhà; chia kẹo thành hai đĩa và hỏi đĩa nào nhiều hơn.",
  },
  "iq-s1": {
    summary: "Nhận ra quy luật lặp lại của màu sắc và hình.",
    homeActivity:
      "Xếp đồ chơi theo quy luật (đỏ – xanh – đỏ – xanh…) và để bé đặt món tiếp theo.",
  },
  "iq-s2": {
    summary: "Phân loại đồ vật và tìm điểm khác biệt.",
    homeActivity:
      "Cùng bé xếp quần áo theo màu hoặc theo người dùng, rồi hỏi vì sao bé xếp như vậy.",
  },
  "mg-s1": {
    summary: "Ghi nhớ vị trí để tìm các cặp giống nhau.",
    homeActivity:
      "Úp vài cặp thìa, cốc giống nhau dưới khăn và cùng bé lật tìm cặp.",
  },
  "mg-s2": {
    summary: "Quan sát, ghi nhớ và kể lại điều vừa thấy.",
    homeActivity:
      "Đặt 3–4 đồ vật lên bàn, che lại, lấy bớt một món và hỏi bé món nào đã biến mất.",
  },
  "ei-s1": {
    summary: "Làm quen tên một số màu bằng tiếng Anh.",
    homeActivity:
      "Khi mặc đồ, hỏi bé màu áo bằng tiếng Anh (red, blue, yellow…) như một trò chơi.",
  },
  "ei-s2": {
    summary: "Làm quen tên con vật và đồ vật bằng tiếng Anh.",
    homeActivity:
      "Chỉ vào đồ chơi con vật, nói tên tiếng Anh và để bé nhắc lại theo.",
  },
  "st-s1": {
    summary: "Nhận ra đồ dùng học tập và công dụng của chúng.",
    homeActivity:
      "Để bé tự chuẩn bị một chiếc túi nhỏ với bút, sách, và kể mỗi món dùng để làm gì.",
  },
  "st-s2": {
    summary: "Làm quen nề nếp hằng ngày và làm theo hướng dẫn.",
    homeActivity:
      "Đưa cho bé hướng dẫn hai bước (“cất giày rồi rửa tay”) và khen khi bé làm theo.",
  },
  "ca-s1": {
    summary: "Kết hợp đếm, chữ cái và quy luật trong một bài.",
    homeActivity:
      "Chọn một trò bé đã thích trong tuần và chơi lại cùng bé, để bé làm “cô giáo” giải thích.",
  },
  "ca-s2": {
    summary: "Kết hợp ghi nhớ, so sánh và tiếng Anh trong một bài.",
    homeActivity:
      "Hỏi bé điều bé thích nhất trong bài thử thách và cùng nghĩ một câu đố tương tự.",
  },
};

/** The placement activity (observations per learning world, not a test). */
export const PLACEMENT_ASSESSMENT = {
  slug: "first-discovery",
  title: "Cùng khám phá",
  intro:
    "Một hoạt động chơi ngắn khoảng 5 phút để little hiểu bé đang quen thuộc với những gì. Không có điểm số và không có đúng sai hiện ra cho bé.",
  questionSlugs: [
    "af-l1-q2",
    "af-l2-q2",
    "nk-l1-q2",
    "nk-l3-q2",
    "iq-l1-q1",
    "iq-l3-q1",
    "mg-l3-q1",
    "st-l1-q1",
  ],
} as const;
