import { type WorldSource, memoryCards, P, pic } from "../helpers";

export const memoryGarden: WorldSource = {
  id: "memory-garden",
  category: "Ghi nhớ",
  description: "Lật thẻ tìm cặp và nhớ những gì con vừa thấy.",
  skills: [
    {
      id: "mg-s1",
      title: "Ghép cặp",
      lessons: [
        {
          id: "mg-l1",
          title: "Ghép cặp hình",
          objective: "Con sẽ lật thẻ và tìm hai hình giống nhau.",
          minutes: 5,
          cover: P.star[1],
          questions: [
            {
              id: "mg-l1-q1",
              type: "memory",
              difficulty: "L1",
              prompt: "Tìm hai hình giống nhau.",
              config: {
                cards: memoryCards(["circle", "star"], [0, 2, 1, 3]),
                columns: 2,
              },
            },
            {
              id: "mg-l1-q2",
              type: "memory",
              difficulty: "L1",
              prompt: "Tìm hai quả giống nhau.",
              config: {
                cards: memoryCards(
                  ["apple", "banana", "orange"],
                  [0, 2, 4, 1, 5, 3],
                ),
                columns: 3,
                peekAfterMismatches: 4,
              },
            },
            {
              id: "mg-l1-q3",
              type: "memory",
              difficulty: "L2",
              prompt: "Tìm hai con vật giống nhau.",
              config: {
                cards: memoryCards(["cat", "dog", "fish"], [2, 0, 5, 1, 4, 3]),
                columns: 3,
                peekAfterMismatches: 4,
              },
            },
          ],
        },
        {
          id: "mg-l2",
          title: "Ghép cặp nhiều hơn",
          objective: "Con sẽ nhớ vị trí của nhiều thẻ hơn.",
          minutes: 5,
          cover: P.cat[1],
          questions: [
            {
              id: "mg-l2-q1",
              type: "memory",
              difficulty: "L2",
              prompt: "Tìm hai hình giống nhau.",
              config: {
                cards: memoryCards(
                  ["circle", "triangle", "square", "star"],
                  [0, 2, 4, 6, 1, 3, 7, 5],
                ),
                columns: 4,
                peekAfterMismatches: 5,
              },
            },
            {
              id: "mg-l2-q2",
              type: "memory",
              difficulty: "L2",
              prompt: "Tìm hai màu giống nhau.",
              config: {
                cards: memoryCards(
                  ["red", "blue", "green"],
                  [0, 2, 4, 1, 5, 3],
                ),
                columns: 3,
                peekAfterMismatches: 4,
              },
            },
            {
              id: "mg-l2-q3",
              type: "memory",
              difficulty: "L3",
              prompt: "Tìm hai đồ vật giống nhau.",
              config: {
                cards: memoryCards(
                  ["book", "pencil", "backpack", "ball"],
                  [3, 6, 0, 5, 2, 7, 4, 1],
                ),
                columns: 4,
                peekAfterMismatches: 5,
              },
            },
          ],
        },
      ],
    },
    {
      id: "mg-s2",
      title: "Nhớ và kể lại",
      lessons: [
        {
          id: "mg-l3",
          title: "Con vừa thấy gì?",
          objective: "Con sẽ nhìn thật kỹ rồi nhớ lại hình vừa thấy.",
          minutes: 5,
          cover: P.apple[1],
          questions: [
            {
              id: "mg-l3-q1",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Con vừa thấy hình nào?",
              memorize: { visuals: [P.apple[1]], seconds: 3 },
              options: [
                pic("a", "banana"),
                pic("b", "apple"),
                pic("c", "orange"),
              ],
            },
            {
              id: "mg-l3-q2",
              type: "image_choice",
              difficulty: "L2",
              prompt: "Hình nào con vừa thấy?",
              memorize: { visuals: [P.cat[1], P.fish[1]], seconds: 4 },
              options: [pic("a", "dog"), pic("b", "bird"), pic("c", "fish")],
            },
            {
              id: "mg-l3-q3",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Con vừa thấy hình nào?",
              memorize: { visuals: [P.star[1]], seconds: 3 },
              options: [
                pic("a", "circle"),
                pic("b", "star"),
                pic("c", "triangle"),
              ],
            },
          ],
        },
        {
          id: "mg-l4",
          title: "Nhớ thứ tự",
          objective: "Con sẽ nhớ và xếp lại đúng thứ tự.",
          minutes: 5,
          cover: P.grapes[1],
          questions: [
            {
              id: "mg-l4-q1",
              type: "ordering",
              difficulty: "L2",
              prompt: "Xếp lại đúng thứ tự con vừa thấy.",
              memorize: {
                visuals: [P.circle[1], P.square[1], P.triangle[1]],
                seconds: 4,
              },
              config: {
                items: [
                  pic("i1", "triangle"),
                  pic("i2", "circle"),
                  pic("i3", "square"),
                ],
              },
            },
            {
              id: "mg-l4-q2",
              type: "ordering",
              difficulty: "L2",
              prompt: "Xếp lại đúng thứ tự con vừa thấy.",
              memorize: {
                visuals: [P.apple[1], P.banana[1], P.grapes[1]],
                seconds: 4,
              },
              config: {
                items: [
                  pic("i1", "grapes"),
                  pic("i2", "apple"),
                  pic("i3", "banana"),
                ],
              },
            },
            {
              id: "mg-l4-q3",
              type: "ordering",
              difficulty: "L3",
              prompt: "Xếp lại đúng thứ tự con vừa thấy.",
              memorize: {
                visuals: [P.cat[1], P.dog[1], P.fish[1], P.bird[1]],
                seconds: 5,
              },
              config: {
                items: [
                  pic("i1", "fish"),
                  pic("i2", "bird"),
                  pic("i3", "cat"),
                  pic("i4", "dog"),
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};
