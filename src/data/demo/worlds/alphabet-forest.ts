import {
  type WorldSource,
  glyph,
  letter,
  letterCards,
  opt,
  P,
  pic,
} from "../helpers";

export const alphabetForest: WorldSource = {
  id: "alphabet-forest",
  category: "Ngôn ngữ",
  description: "Làm quen chữ cái và âm đầu của tiếng.",
  skills: [
    {
      id: "af-s1",
      title: "Nhận biết chữ cái",
      lessons: [
        {
          id: "af-l1",
          title: "Chữ A, B, C",
          objective: "Con sẽ tìm và nhận ra chữ A, B, C.",
          minutes: 5,
          cover: glyph("A", "mint"),
          questions: [
            {
              id: "af-l1-q1",
              type: "single_choice",
              difficulty: "L1",
              prompt: "Đâu là chữ A?",
              options: [letter("a", "O"), letter("b", "A"), letter("c", "E")],
              config: { confirm: true },
              feedback: {
                hint: "Chữ A trông giống mái nhà có một gạch ngang.",
              },
            },
            {
              id: "af-l1-q2",
              type: "single_choice",
              difficulty: "L1",
              prompt: "Đâu là chữ B?",
              options: [letter("a", "D"), letter("b", "P"), letter("c", "B")],
              config: { confirm: false },
              feedback: { hint: "Chữ B có hai vòng tròn nhỏ." },
            },
            {
              id: "af-l1-q3",
              type: "matching",
              difficulty: "L2",
              prompt: "Nối chữ in hoa với chữ thường giống nó.",
              config: {
                left: [letter("l1", "A"), letter("l2", "B"), letter("l3", "C")],
                right: [
                  opt("r1", "Chữ c thường", glyph("c", "mint")),
                  opt("r2", "Chữ a thường", glyph("a", "mint")),
                  opt("r3", "Chữ b thường", glyph("b", "mint")),
                ],
              },
              feedback: {
                hint: "Chạm một chữ bên trái, rồi chạm chữ giống nó bên phải.",
              },
            },
          ],
        },
        {
          id: "af-l2",
          title: "Chữ M, T, O",
          objective: "Con sẽ nhận ra chữ M, T, O.",
          minutes: 5,
          cover: glyph("M", "mint"),
          questions: [
            {
              id: "af-l2-q1",
              type: "single_choice",
              difficulty: "L1",
              prompt: "Đâu là chữ M?",
              options: [letter("a", "N"), letter("b", "M"), letter("c", "H")],
              config: { confirm: false },
              feedback: { hint: "Chữ M có hai đỉnh núi." },
            },
            {
              id: "af-l2-q2",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Đâu là chữ T?",
              options: [letter("a", "T"), letter("b", "L"), letter("c", "I")],
              feedback: { hint: "Chữ T có một gạch ngang ở trên." },
            },
            {
              id: "af-l2-q3",
              type: "memory",
              difficulty: "L2",
              prompt: "Tìm hai chữ giống nhau.",
              config: {
                cards: letterCards(["M", "T", "O"], [0, 2, 4, 1, 5, 3]),
                columns: 3,
                peekAfterMismatches: 4,
              },
            },
          ],
        },
      ],
    },
    {
      id: "af-s2",
      title: "Âm đầu",
      lessons: [
        {
          id: "af-l3",
          title: "Tiếng bắt đầu bằng chữ…",
          objective: "Con sẽ nghe và tìm tiếng có âm đầu giống chữ cái.",
          minutes: 5,
          cover: P.fish[1],
          questions: [
            {
              id: "af-l3-q1",
              type: "image_choice",
              difficulty: "L2",
              prompt: "Tiếng nào bắt đầu bằng chữ C?",
              stimulus: glyph("C", "lavender"),
              options: [
                pic("a", "cat", "mèo"),
                pic("b", "fish", "cá"),
                pic("c", "chicken", "gà"),
              ],
              feedback: { hint: "Nghe kỹ nhé: cờ… cá." },
            },
            {
              id: "af-l3-q2",
              type: "image_choice",
              difficulty: "L2",
              prompt: "Tiếng nào bắt đầu bằng chữ M?",
              stimulus: glyph("M", "lavender"),
              options: [
                pic("a", "chicken", "gà"),
                pic("b", "fish", "cá"),
                pic("c", "cat", "mèo"),
              ],
              feedback: { hint: "Nghe kỹ nhé: mờ… mèo." },
            },
            {
              id: "af-l3-q3",
              type: "image_choice",
              difficulty: "L2",
              prompt: "Tiếng nào bắt đầu bằng chữ G?",
              stimulus: glyph("G", "lavender"),
              options: [
                pic("a", "chicken", "gà"),
                pic("b", "cat", "mèo"),
                pic("c", "fish", "cá"),
              ],
              feedback: { hint: "Nghe kỹ nhé: gờ… gà." },
            },
          ],
        },
        {
          id: "af-l4",
          title: "Ghép chữ với hình",
          objective: "Con sẽ ghép chữ cái với hình có âm đầu giống nhau.",
          minutes: 5,
          cover: P.cat[1],
          questions: [
            {
              id: "af-l4-q1",
              type: "matching",
              difficulty: "L3",
              prompt: "Nối chữ với hình có âm đầu giống nhau.",
              config: {
                left: [letter("l1", "M"), letter("l2", "C"), letter("l3", "G")],
                right: [
                  pic("r1", "fish", "cá"),
                  pic("r2", "chicken", "gà"),
                  pic("r3", "cat", "mèo"),
                ],
              },
              feedback: { hint: "Đọc tên con vật thật chậm: mèo, cá, gà." },
            },
            {
              id: "af-l4-q2",
              type: "image_choice",
              difficulty: "L2",
              prompt: "Tiếng nào bắt đầu bằng chữ T?",
              stimulus: glyph("T", "lavender"),
              options: [
                pic("a", "fish", "cá"),
                pic("b", "apple", "táo"),
                pic("c", "chicken", "gà"),
              ],
              feedback: { hint: "Nghe kỹ nhé: tờ… táo." },
            },
            {
              id: "af-l4-q3",
              type: "single_choice",
              difficulty: "L3",
              prompt: "Tiếng “cá” bắt đầu bằng chữ nào?",
              stimulus: P.fish[1],
              options: [letter("a", "M"), letter("b", "G"), letter("c", "C")],
              config: { confirm: true },
              feedback: { hint: "Cá… cờ…" },
            },
          ],
        },
      ],
    },
  ],
};
