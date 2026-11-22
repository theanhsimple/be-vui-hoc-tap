import {
  type WorldSource,
  group,
  letter,
  memoryCards,
  num,
  opt,
  glyph,
  P,
  pic,
} from "../helpers";

export const challengeArena: WorldSource = {
  id: "challenge-arena",
  category: "Thử thách tổng hợp",
  description: "Ôn lại nhiều kỹ năng trong cùng một bài.",
  unlock: { minCompletedLessons: 3 },
  skills: [
    {
      id: "ca-s1",
      title: "Thử thách nhỏ",
      lessons: [
        {
          id: "ca-l1",
          title: "Thử thách số 1",
          objective: "Con sẽ đếm, tìm chữ và hoàn thành quy luật.",
          minutes: 5,
          cover: group("shape.star", 3),
          questions: [
            {
              id: "ca-l1-q1",
              type: "single_choice",
              difficulty: "L2",
              prompt: "Có bao nhiêu ngôi sao?",
              stimulus: group("shape.star", 6),
              options: [num("a", 5), num("b", 6), num("c", 7)],
              config: { confirm: false },
            },
            {
              id: "ca-l1-q2",
              type: "single_choice",
              difficulty: "L1",
              prompt: "Đâu là chữ B?",
              options: [letter("a", "P"), letter("b", "B"), letter("c", "D")],
              config: { confirm: false },
            },
            {
              id: "ca-l1-q3",
              type: "pattern",
              difficulty: "L2",
              prompt: "Chọn hình tiếp theo.",
              config: {
                sequence: [
                  pic("s1", "apple"),
                  pic("s2", "banana"),
                  pic("s3", "apple"),
                  pic("s4", "banana"),
                  null,
                ],
                palette: [
                  pic("p1", "orange"),
                  pic("p2", "apple"),
                  pic("p3", "banana"),
                ],
              },
            },
          ],
        },
        {
          id: "ca-l2",
          title: "Thử thách số 2",
          objective: "Con sẽ ghi nhớ, xếp số và tìm điểm khác.",
          minutes: 5,
          cover: P.book[1],
          questions: [
            {
              id: "ca-l2-q1",
              type: "memory",
              difficulty: "L3",
              prompt: "Tìm hai hình giống nhau.",
              config: {
                cards: memoryCards(
                  ["cat", "apple", "book", "star"],
                  [3, 6, 0, 5, 2, 7, 4, 1],
                ),
                columns: 4,
                peekAfterMismatches: 5,
              },
            },
            {
              id: "ca-l2-q2",
              type: "ordering",
              difficulty: "L2",
              prompt: "Xếp các số từ bé đến lớn.",
              config: {
                items: [num("i1", 4), num("i2", 2), num("i3", 1), num("i4", 3)],
              },
            },
            {
              id: "ca-l2-q3",
              type: "image_choice",
              difficulty: "L2",
              prompt: "Cái nào không phải là quả?",
              options: [
                pic("a", "orange"),
                pic("b", "grapes"),
                pic("c", "pencil"),
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ca-s2",
      title: "Thử thách lớn",
      lessons: [
        {
          id: "ca-l3",
          title: "Thử thách số 3",
          objective: "Con sẽ ghép chữ, nghe tiếng Anh và so sánh số.",
          minutes: 5,
          cover: glyph("T", "coral"),
          questions: [
            {
              id: "ca-l3-q1",
              type: "matching",
              difficulty: "L2",
              prompt: "Nối chữ in hoa với chữ thường.",
              config: {
                left: [letter("l1", "M"), letter("l2", "T"), letter("l3", "O")],
                right: [
                  opt("r1", "Chữ o thường", glyph("o", "mint")),
                  opt("r2", "Chữ m thường", glyph("m", "mint")),
                  opt("r3", "Chữ t thường", glyph("t", "mint")),
                ],
              },
            },
            {
              id: "ca-l3-q2",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Find the bird! Con hãy tìm “the bird”.",
              options: [pic("a", "fish"), pic("b", "bird"), pic("c", "dog")],
              feedback: { hint: "“bird” là con chim." },
            },
            {
              id: "ca-l3-q3",
              type: "single_choice",
              difficulty: "L2",
              prompt: "Số nào bé nhất?",
              options: [num("a", 7), num("b", 5), num("c", 3)],
              config: { confirm: true },
            },
          ],
        },
        {
          id: "ca-l4",
          title: "Thử thách số 4",
          objective: "Con sẽ so sánh, tìm quy luật và ghi nhớ.",
          minutes: 5,
          cover: P.grapes[1],
          questions: [
            {
              id: "ca-l4-q1",
              type: "ordering",
              difficulty: "L2",
              prompt: "Xếp từ ít đến nhiều.",
              config: {
                items: [
                  {
                    id: "i1",
                    label: "3 quả táo",
                    visual: group("food.apple", 3),
                  },
                  {
                    id: "i2",
                    label: "1 quả táo",
                    visual: group("food.apple", 1),
                  },
                  {
                    id: "i3",
                    label: "2 quả táo",
                    visual: group("food.apple", 2),
                  },
                ],
              },
            },
            {
              id: "ca-l4-q2",
              type: "pattern",
              difficulty: "L3",
              prompt: "Chọn hai màu còn thiếu.",
              config: {
                sequence: [
                  pic("s1", "red"),
                  pic("s2", "yellow"),
                  pic("s3", "red"),
                  pic("s4", "yellow"),
                  null,
                  null,
                ],
                palette: [
                  pic("p1", "yellow"),
                  pic("p2", "red"),
                  pic("p3", "blue"),
                ],
              },
            },
            {
              id: "ca-l4-q3",
              type: "image_choice",
              difficulty: "L2",
              prompt: "Con vừa thấy hình nào?",
              memorize: { visuals: [P.grapes[1]], seconds: 3 },
              options: [
                pic("a", "orange"),
                pic("b", "apple"),
                pic("c", "grapes"),
              ],
            },
          ],
        },
      ],
    },
  ],
};
