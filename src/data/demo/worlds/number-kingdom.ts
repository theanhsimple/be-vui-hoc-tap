import { type WorldSource, group, num, P, pic } from "../helpers";

export const numberKingdom: WorldSource = {
  id: "number-kingdom",
  category: "Toán học",
  description: "Đếm, nhận biết số, so sánh và hình dạng.",
  skills: [
    {
      id: "nk-s1",
      title: "Đếm số lượng",
      lessons: [
        {
          id: "nk-l1",
          title: "Đếm đến 5",
          objective: "Con sẽ đếm đồ vật và xếp số từ 1 đến 5.",
          minutes: 5,
          cover: group("food.apple", 3),
          questions: [
            {
              id: "nk-l1-q1",
              type: "single_choice",
              difficulty: "L1",
              prompt: "Có bao nhiêu quả táo?",
              stimulus: group("food.apple", 3),
              options: [num("a", 2), num("b", 3), num("c", 4)],
              config: { confirm: false },
              feedback: { hint: "Chạm ngón tay vào từng quả và đếm nhé." },
            },
            {
              id: "nk-l1-q2",
              type: "single_choice",
              difficulty: "L1",
              prompt: "Có bao nhiêu quả bóng?",
              stimulus: group("object.ball", 5),
              options: [num("a", 5), num("b", 4), num("c", 3)],
              config: { confirm: false },
              feedback: { hint: "Đếm chậm: một, hai, ba…" },
            },
            {
              id: "nk-l1-q3",
              type: "ordering",
              difficulty: "L1",
              prompt: "Xếp các số từ bé đến lớn.",
              config: { items: [num("i1", 3), num("i2", 1), num("i3", 2)] },
              feedback: { hint: "Số nào đếm trước tiên?" },
            },
          ],
        },
        {
          id: "nk-l2",
          title: "Đếm đến 10",
          objective: "Con sẽ đếm nhóm đồ vật đến 10.",
          minutes: 5,
          cover: group("object.ball", 4),
          questions: [
            {
              id: "nk-l2-q1",
              type: "single_choice",
              difficulty: "L2",
              prompt: "Có bao nhiêu quả táo?",
              stimulus: group("food.apple", 7),
              options: [num("a", 8), num("b", 6), num("c", 7)],
              config: { confirm: true },
              feedback: { hint: "Đếm từng hàng một nhé." },
            },
            {
              id: "nk-l2-q2",
              type: "image_choice",
              difficulty: "L2",
              prompt: "Nhóm nào có 4 quả bóng?",
              options: [
                {
                  id: "a",
                  label: "3 quả bóng",
                  visual: group("object.ball", 3),
                },
                {
                  id: "b",
                  label: "5 quả bóng",
                  visual: group("object.ball", 5),
                },
                {
                  id: "c",
                  label: "4 quả bóng",
                  visual: group("object.ball", 4),
                },
              ],
              feedback: { hint: "Đếm số bóng trong mỗi nhóm." },
            },
            {
              id: "nk-l2-q3",
              type: "ordering",
              difficulty: "L2",
              prompt: "Xếp các số từ bé đến lớn.",
              config: {
                items: [num("i1", 8), num("i2", 5), num("i3", 7), num("i4", 6)],
              },
              feedback: { hint: "Bắt đầu từ số 5 nhé." },
            },
          ],
        },
      ],
    },
    {
      id: "nk-s2",
      title: "Hình dạng & so sánh",
      lessons: [
        {
          id: "nk-l3",
          title: "Nhận biết các hình dạng",
          objective: "Con sẽ tìm những hình giống nhau.",
          minutes: 5,
          cover: P.triangle[1],
          questions: [
            {
              id: "nk-l3-q1",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Đâu là hình tròn?",
              options: [
                pic("a", "triangle"),
                pic("b", "square"),
                pic("c", "circle"),
              ],
              feedback: { hint: "Hình tròn không có góc nhọn." },
            },
            {
              id: "nk-l3-q2",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Đâu là hình tam giác?",
              options: [
                pic("a", "triangle"),
                pic("b", "circle"),
                pic("c", "star"),
              ],
              feedback: { hint: "Hình tam giác có ba cạnh." },
            },
            {
              id: "nk-l3-q3",
              type: "pattern",
              difficulty: "L2",
              prompt: "Chọn hình tiếp theo.",
              config: {
                sequence: [
                  pic("s1", "circle"),
                  pic("s2", "square"),
                  pic("s3", "circle"),
                  pic("s4", "square"),
                  null,
                ],
                palette: [
                  pic("p1", "circle"),
                  pic("p2", "triangle"),
                  pic("p3", "square"),
                ],
              },
              feedback: { hint: "Tròn, vuông, tròn, vuông… rồi đến hình gì?" },
            },
          ],
        },
        {
          id: "nk-l4",
          title: "Nhiều hơn, ít hơn",
          objective: "Con sẽ so sánh nhóm nào nhiều hơn, ít hơn.",
          minutes: 5,
          cover: group("shape.star", 2),
          questions: [
            {
              id: "nk-l4-q1",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Nhóm nào có nhiều quả táo hơn?",
              options: [
                { id: "a", label: "2 quả táo", visual: group("food.apple", 2) },
                { id: "b", label: "5 quả táo", visual: group("food.apple", 5) },
              ],
            },
            {
              id: "nk-l4-q2",
              type: "matching",
              difficulty: "L2",
              prompt: "Nối mỗi nhóm với số đúng.",
              config: {
                left: [
                  {
                    id: "l1",
                    label: "2 ngôi sao",
                    visual: group("shape.star", 2),
                  },
                  {
                    id: "l2",
                    label: "3 ngôi sao",
                    visual: group("shape.star", 3),
                  },
                  {
                    id: "l3",
                    label: "1 ngôi sao",
                    visual: group("shape.star", 1),
                  },
                ],
                right: [num("r1", 3), num("r2", 1), num("r3", 2)],
              },
              feedback: { hint: "Đếm số sao trong mỗi nhóm trước nhé." },
            },
            {
              id: "nk-l4-q3",
              type: "single_choice",
              difficulty: "L2",
              prompt: "Số nào lớn nhất?",
              options: [num("a", 2), num("b", 9), num("c", 5)],
              config: { confirm: true },
              feedback: { hint: "Số nào đếm sau cùng?" },
            },
          ],
        },
      ],
    },
  ],
};
