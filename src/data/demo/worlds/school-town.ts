import { type WorldSource, memoryCards, P, pic } from "../helpers";

export const schoolTown: WorldSource = {
  id: "school-town",
  category: "Sẵn sàng vào lớp 1",
  description: "Làm quen đồ dùng học tập và nề nếp hằng ngày.",
  skills: [
    {
      id: "st-s1",
      title: "Đồ dùng học tập",
      lessons: [
        {
          id: "st-l1",
          title: "Đồ dùng của bé",
          objective: "Con sẽ nhận ra sách, bút chì và cặp sách.",
          minutes: 5,
          cover: P.backpack[1],
          questions: [
            {
              id: "st-l1-q1",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Đâu là quyển sách?",
              options: [pic("a", "ball"), pic("b", "book"), pic("c", "apple")],
            },
            {
              id: "st-l1-q2",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Đâu là bút chì?",
              options: [
                pic("a", "pencil"),
                pic("b", "banana"),
                pic("c", "fish"),
              ],
            },
            {
              id: "st-l1-q3",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Đâu là cặp sách?",
              options: [
                pic("a", "bed", "Cái giường"),
                pic("b", "bowl", "Cái bát"),
                pic("c", "backpack"),
              ],
            },
          ],
        },
        {
          id: "st-l2",
          title: "Ở lớp học",
          objective: "Con sẽ biết dùng đồ dùng học tập để làm gì.",
          minutes: 5,
          cover: P.pencil[1],
          questions: [
            {
              id: "st-l2-q1",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Con dùng gì để viết và vẽ?",
              options: [pic("a", "ball"), pic("b", "pencil"), pic("c", "cat")],
            },
            {
              id: "st-l2-q2",
              type: "single_choice",
              difficulty: "L2",
              prompt: "Cái nào không phải đồ dùng học tập?",
              options: [pic("a", "book"), pic("b", "ball"), pic("c", "pencil")],
              config: { confirm: true },
              feedback: { hint: "Cái nào dùng để chơi?" },
            },
            {
              id: "st-l2-q3",
              type: "memory",
              difficulty: "L2",
              prompt: "Tìm hai đồ dùng giống nhau.",
              config: {
                cards: memoryCards(
                  ["book", "pencil", "backpack"],
                  [0, 2, 4, 1, 5, 3],
                ),
                columns: 3,
                peekAfterMismatches: 4,
              },
            },
          ],
        },
      ],
    },
    {
      id: "st-s2",
      title: "Nề nếp hằng ngày",
      lessons: [
        {
          id: "st-l3",
          title: "Giữ gìn vệ sinh",
          objective: "Con sẽ chọn việc làm đúng lúc.",
          minutes: 5,
          cover: P.soap[1],
          questions: [
            {
              id: "st-l3-q1",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Trước khi ăn, con cần làm gì?",
              options: [
                pic("a", "bed"),
                pic("b", "soap"),
                pic("c", "ball", "Chơi bóng"),
              ],
            },
            {
              id: "st-l3-q2",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Buổi tối trước khi đi ngủ, con làm gì?",
              options: [
                pic("a", "toothbrush"),
                pic("b", "backpack", "Đi học"),
                pic("c", "ball", "Chơi bóng"),
              ],
            },
            {
              id: "st-l3-q3",
              type: "ordering",
              difficulty: "L2",
              prompt: "Xếp việc buổi sáng theo thứ tự.",
              config: {
                items: [
                  pic("i1", "backpack", "Đi học"),
                  pic("i2", "bed", "Thức dậy"),
                  pic("i3", "bowl", "Ăn sáng"),
                ],
              },
              feedback: { hint: "Việc đầu tiên khi trời sáng là gì?" },
            },
          ],
        },
        {
          id: "st-l4",
          title: "Làm theo hướng dẫn",
          objective: "Con sẽ lắng nghe và làm theo lời cô.",
          minutes: 5,
          cover: P.star[1],
          questions: [
            {
              id: "st-l4-q1",
              type: "ordering",
              difficulty: "L2",
              prompt: "Xếp theo lời cô: ngôi sao, hình tròn, hình vuông.",
              config: {
                items: [
                  pic("i1", "circle"),
                  pic("i2", "square"),
                  pic("i3", "star"),
                ],
              },
            },
            {
              id: "st-l4-q2",
              type: "ordering",
              difficulty: "L2",
              prompt: "Xếp theo lời cô: quả táo, quả chuối, chùm nho.",
              config: {
                items: [
                  pic("i1", "banana"),
                  pic("i2", "grapes"),
                  pic("i3", "apple"),
                ],
              },
            },
            {
              id: "st-l4-q3",
              type: "single_choice",
              difficulty: "L1",
              prompt: "Đèn giao thông màu gì thì được đi?",
              options: [pic("a", "red"), pic("b", "yellow"), pic("c", "green")],
              config: { confirm: false },
            },
          ],
        },
      ],
    },
  ],
};
