import { type WorldSource, group, P, pic } from "../helpers";

export const iqCastle: WorldSource = {
  id: "iq-castle",
  category: "Tư duy logic",
  description: "Tìm quy luật, tìm điểm khác và xếp nhóm.",
  skills: [
    {
      id: "iq-s1",
      title: "Quy luật",
      lessons: [
        {
          id: "iq-l1",
          title: "Quy luật màu và hình",
          objective: "Con sẽ tìm hình còn thiếu trong dãy.",
          minutes: 5,
          cover: P.red[1],
          questions: [
            {
              id: "iq-l1-q1",
              type: "pattern",
              difficulty: "L1",
              prompt: "Chọn màu tiếp theo.",
              config: {
                sequence: [
                  pic("s1", "red"),
                  pic("s2", "blue"),
                  pic("s3", "red"),
                  pic("s4", "blue"),
                  null,
                ],
                palette: [
                  pic("p1", "blue"),
                  pic("p2", "red"),
                  pic("p3", "yellow"),
                ],
              },
              feedback: { hint: "Đỏ, xanh, đỏ, xanh…" },
            },
            {
              id: "iq-l1-q2",
              type: "pattern",
              difficulty: "L2",
              prompt: "Chọn hình tiếp theo.",
              config: {
                sequence: [
                  pic("s1", "star"),
                  pic("s2", "star"),
                  pic("s3", "circle"),
                  pic("s4", "star"),
                  pic("s5", "star"),
                  null,
                ],
                palette: [
                  pic("p1", "star"),
                  pic("p2", "circle"),
                  pic("p3", "square"),
                ],
              },
              feedback: { hint: "Hai ngôi sao rồi đến một hình khác." },
            },
            {
              id: "iq-l1-q3",
              type: "pattern",
              difficulty: "L2",
              prompt: "Chọn hình tiếp theo.",
              config: {
                sequence: [
                  pic("s1", "triangle"),
                  pic("s2", "circle"),
                  pic("s3", "square"),
                  pic("s4", "triangle"),
                  pic("s5", "circle"),
                  null,
                ],
                palette: [
                  pic("p1", "circle"),
                  pic("p2", "triangle"),
                  pic("p3", "square"),
                ],
              },
              feedback: { hint: "Ba hình lặp lại theo cùng thứ tự." },
            },
          ],
        },
        {
          id: "iq-l2",
          title: "Quy luật dài hơn",
          objective: "Con sẽ hoàn thành những dãy dài hơn.",
          minutes: 5,
          cover: P.green[1],
          questions: [
            {
              id: "iq-l2-q1",
              type: "pattern",
              difficulty: "L2",
              prompt: "Chọn màu tiếp theo.",
              config: {
                sequence: [
                  pic("s1", "yellow"),
                  pic("s2", "yellow"),
                  pic("s3", "green"),
                  pic("s4", "yellow"),
                  pic("s5", "yellow"),
                  null,
                ],
                palette: [
                  pic("p1", "yellow"),
                  pic("p2", "green"),
                  pic("p3", "red"),
                ],
              },
              feedback: { hint: "Vàng, vàng, rồi đến màu gì?" },
            },
            {
              id: "iq-l2-q2",
              type: "pattern",
              difficulty: "L3",
              prompt: "Chọn hai hình còn thiếu.",
              config: {
                sequence: [
                  pic("s1", "circle"),
                  pic("s2", "triangle"),
                  pic("s3", "circle"),
                  pic("s4", "triangle"),
                  null,
                  null,
                ],
                palette: [
                  pic("p1", "triangle"),
                  pic("p2", "circle"),
                  pic("p3", "star"),
                ],
              },
              feedback: { hint: "Tròn, tam giác, tròn, tam giác…" },
            },
            {
              id: "iq-l2-q3",
              type: "ordering",
              difficulty: "L2",
              prompt: "Xếp từ ít đến nhiều.",
              config: {
                items: [
                  {
                    id: "i1",
                    label: "3 ngôi sao",
                    visual: group("shape.star", 3),
                  },
                  {
                    id: "i2",
                    label: "1 ngôi sao",
                    visual: group("shape.star", 1),
                  },
                  {
                    id: "i3",
                    label: "2 ngôi sao",
                    visual: group("shape.star", 2),
                  },
                ],
              },
              feedback: { hint: "Nhóm nào có ít sao nhất?" },
            },
          ],
        },
      ],
    },
    {
      id: "iq-s2",
      title: "Phân loại",
      lessons: [
        {
          id: "iq-l3",
          title: "Tìm hình khác",
          objective: "Con sẽ tìm hình không giống các hình còn lại.",
          minutes: 5,
          cover: P.square[1],
          questions: [
            {
              id: "iq-l3-q1",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Hình nào khác các hình còn lại?",
              options: [
                pic("a", "circle"),
                pic("b", "square"),
                pic("c", "circle"),
              ],
            },
            {
              id: "iq-l3-q2",
              type: "image_choice",
              difficulty: "L2",
              prompt: "Cái nào không phải là quả?",
              options: [pic("a", "apple"), pic("b", "cat"), pic("c", "banana")],
              feedback: { hint: "Hai thứ ăn được, một con vật." },
            },
            {
              id: "iq-l3-q3",
              type: "image_choice",
              difficulty: "L2",
              prompt: "Cái nào không phải là con vật?",
              options: [pic("a", "dog"), pic("b", "book"), pic("c", "cat")],
              feedback: { hint: "Con vật nào biết chạy?" },
            },
          ],
        },
        {
          id: "iq-l4",
          title: "Xếp nhóm",
          objective: "Con sẽ ghép và xếp đồ vật theo nhóm.",
          minutes: 5,
          cover: P.orange[1],
          questions: [
            {
              id: "iq-l4-q1",
              type: "matching",
              difficulty: "L2",
              prompt: "Nối màu với quả có màu đó.",
              config: {
                left: [
                  pic("l1", "red"),
                  pic("l2", "yellow"),
                  pic("l3", "orangeColor"),
                ],
                right: [
                  pic("r1", "banana"),
                  pic("r2", "orange"),
                  pic("r3", "apple"),
                ],
              },
              feedback: { hint: "Quả táo màu gì?" },
            },
            {
              id: "iq-l4-q2",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Đâu là đồ dùng học tập?",
              options: [pic("a", "fish"), pic("b", "apple"), pic("c", "book")],
            },
            {
              id: "iq-l4-q3",
              type: "image_choice",
              difficulty: "L1",
              prompt: "Đâu là con vật?",
              options: [
                pic("a", "pencil"),
                pic("b", "fish"),
                pic("c", "banana"),
              ],
            },
          ],
        },
      ],
    },
  ],
};
