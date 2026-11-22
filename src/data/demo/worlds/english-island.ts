import type { LearningQuestion } from "@/features/learning/types";

import { type PictureKey, type WorldSource, P, pic } from "../helpers";

/** "Find X!" picture question with the English word spoken in the prompt. */
function find(
  id: string,
  word: string,
  vi: string,
  keys: [PictureKey, PictureKey, PictureKey],
): LearningQuestion {
  return {
    id,
    type: "image_choice",
    difficulty: "L1",
    prompt: `Find ${word}! Con hãy tìm “${word}”.`,
    options: [pic("a", keys[0]), pic("b", keys[1]), pic("c", keys[2])],
    feedback: {
      correctText: `Yes! ${word} — ${vi}.`,
      hint: `“${word}” là ${vi}.`,
    },
  };
}

export const englishIsland: WorldSource = {
  id: "english-island",
  category: "Tiếng Anh",
  description: "Nghe và tìm màu sắc, con vật, đồ vật bằng tiếng Anh.",
  skills: [
    {
      id: "ei-s1",
      title: "Colours — Màu sắc",
      lessons: [
        {
          id: "ei-l1",
          title: "Red, blue, yellow",
          objective: "Con sẽ nghe tên màu tiếng Anh và tìm màu đó.",
          minutes: 5,
          cover: P.blue[1],
          questions: [
            find("ei-l1-q1", "red", "màu đỏ", ["blue", "red", "yellow"]),
            find("ei-l1-q2", "blue", "màu xanh dương", [
              "yellow",
              "green",
              "blue",
            ]),
            find("ei-l1-q3", "yellow", "màu vàng", ["yellow", "red", "blue"]),
          ],
        },
        {
          id: "ei-l2",
          title: "Green, orange, purple",
          objective: "Con sẽ học thêm ba màu mới.",
          minutes: 5,
          cover: P.purple[1],
          questions: [
            find("ei-l2-q1", "green", "màu xanh lá", [
              "purple",
              "green",
              "orangeColor",
            ]),
            find("ei-l2-q2", "orange", "màu cam", [
              "orangeColor",
              "red",
              "yellow",
            ]),
            find("ei-l2-q3", "purple", "màu tím", ["blue", "green", "purple"]),
          ],
        },
      ],
    },
    {
      id: "ei-s2",
      title: "Animals & things — Con vật và đồ vật",
      lessons: [
        {
          id: "ei-l3",
          title: "Animals",
          objective: "Con sẽ nghe tên con vật tiếng Anh và tìm hình.",
          minutes: 5,
          cover: P.dog[1],
          questions: [
            find("ei-l3-q1", "the cat", "con mèo", ["dog", "cat", "fish"]),
            find("ei-l3-q2", "the dog", "con chó", ["dog", "bird", "cat"]),
            find("ei-l3-q3", "the fish", "con cá", ["bird", "cat", "fish"]),
          ],
        },
        {
          id: "ei-l4",
          title: "Things around me",
          objective: "Con sẽ tìm đồ vật quen thuộc bằng tiếng Anh.",
          minutes: 5,
          cover: P.book[1],
          questions: [
            find("ei-l4-q1", "the book", "quyển sách", [
              "ball",
              "book",
              "apple",
            ]),
            find("ei-l4-q2", "the ball", "quả bóng", [
              "apple",
              "pencil",
              "ball",
            ]),
            find("ei-l4-q3", "the apple", "quả táo", [
              "apple",
              "banana",
              "orange",
            ]),
          ],
        },
      ],
    },
  ],
};
