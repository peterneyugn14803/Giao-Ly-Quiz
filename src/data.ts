import { QuestionItem } from './types';
import { CATECHISM_DATA as PARSED_DATA } from './data/catechism';

// Merged database of all parsed Catechism questions
export const CATECHISM_DATA: QuestionItem[] = PARSED_DATA;

// Grouping helpers for Browse Mode
export interface LessonGroup {
  name: string;
  questions: QuestionItem[];
}

export interface ChapterGroup {
  name: string;
  lessons: Record<string, LessonGroup>;
}

export interface PartGroup {
  name: string;
  chapters: Record<string, ChapterGroup>;
}

export function getGroupedCatechismByPart(): Record<string, PartGroup> {
  const grouped: Record<string, PartGroup> = {};

  CATECHISM_DATA.forEach((item) => {
    const part = item.part || "PHẦN THÚ NHẤT: TUYÊN XƯNG ĐỨC TIN";
    const chap = item.chapter || "CHƯƠNG PHỤ";
    const les = item.lesson || "BÀI HỌC CHUNG";

    if (!grouped[part]) {
      grouped[part] = {
        name: part,
        chapters: {}
      };
    }

    if (!grouped[part].chapters[chap]) {
      grouped[part].chapters[chap] = {
        name: chap,
        lessons: {}
      };
    }

    if (!grouped[part].chapters[chap].lessons[les]) {
      grouped[part].chapters[chap].lessons[les] = {
        name: les,
        questions: []
      };
    }

    grouped[part].chapters[chap].lessons[les].questions.push(item);
  });

  return grouped;
}

export function getGroupedCatechism(): Record<string, ChapterGroup> {
  const grouped: Record<string, ChapterGroup> = {};

  CATECHISM_DATA.forEach((item) => {
    const chap = item.chapter || "CHƯƠNG PHỤ";
    const les = item.lesson || "BÀI HỌC CHUNG";

    if (!grouped[chap]) {
      grouped[chap] = {
        name: chap,
        lessons: {}
      };
    }

    if (!grouped[chap].lessons[les]) {
      grouped[chap].lessons[les] = {
        name: les,
        questions: []
      };
    }

    grouped[chap].lessons[les].questions.push(item);
  });

  return grouped;
}

// Hierarchical structures for upgraded Browse Mode matching official Compendium structure
export interface StructuredLesson {
  name: string;
  lessonId: number;
  questions: QuestionItem[];
}

export interface StructuredChapter {
  name: string;
  lessons: StructuredLesson[];
}

export interface StructuredSection {
  name: string;
  chapters: StructuredChapter[];
  lessonsWithoutChapter: StructuredLesson[];
}

export interface StructuredPart {
  name: string;
  short: string;
  title: string;
  subtitle: string;
  color: string;
  sections: StructuredSection[];
}

const getLessonNum = (lessonStr: string): number => {
  const match = lessonStr.match(/BÀI\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
};

export function getStructuredCatechism(): StructuredPart[] {
  // 1. Group all questions into lesson numbers first
  const lessonsMap = new Map<number, { name: string; questions: QuestionItem[] }>();
  CATECHISM_DATA.forEach(q => {
    const num = getLessonNum(q.lesson);
    if (num > 0) {
      if (!lessonsMap.has(num)) {
        lessonsMap.set(num, { name: q.lesson, questions: [] });
      }
      lessonsMap.get(num)!.questions.push(q);
    }
  });

  const getLessonObj = (num: number): StructuredLesson | null => {
    const data = lessonsMap.get(num);
    if (!data) return null;
    return {
      name: data.name,
      lessonId: num,
      questions: data.questions
    };
  };

  const getLessonsRange = (start: number, end: number): StructuredLesson[] => {
    const arr: StructuredLesson[] = [];
    for (let i = start; i <= end; i++) {
      const les = getLessonObj(i);
      if (les) arr.push(les);
    }
    return arr;
  };

  const cleanLessonList = (lessons: (StructuredLesson | null)[]): StructuredLesson[] => {
    return lessons.filter((l): l is StructuredLesson => l !== null);
  };

  return [
    {
      name: "PHẦN THỨ NHẤT: TUYÊN XƯNG ĐỨC TIN",
      short: "PHẦN I",
      title: "Tuyên Xưng Đức Tin",
      subtitle: "Nội dung Kinh Tin Kính",
      color: "blue",
      sections: [
        {
          name: "Mục thứ nhất: “Tôi tin” – “Chúng tôi tin”",
          chapters: [
            {
              name: "Chương một: Con người “có khả năng” đón nhận Thiên Chúa",
              lessons: getLessonsRange(1, 1)
            },
            {
              name: "Chương hai: Thiên Chúa đến gặp con người",
              lessons: getLessonsRange(2, 4)
            },
            {
              name: "Chương ba: Con người đáp lời Thiên Chúa",
              lessons: getLessonsRange(5, 6)
            }
          ],
          lessonsWithoutChapter: []
        },
        {
          name: "Mục thứ hai: Tuyên xưng Đức tin Kitô giáo",
          chapters: [
            {
              name: "Chương một: Tôi tin kính Đức Chúa Trời là Cha",
              lessons: getLessonsRange(7, 12)
            },
            {
              name: "Chương hai: Tôi tin kính Đức Chúa Giêsu Kitô, Con Một Thiên Chúa",
              lessons: getLessonsRange(13, 18)
            },
            {
              name: "Chương ba: Tôi tin kính Đức Chúa Thánh Thần",
              lessons: getLessonsRange(19, 29)
            }
          ],
          lessonsWithoutChapter: []
        }
      ]
    },
    {
      name: "PHẦN THỨ HAI: CỬ HÀNH MẦU NHIỆM KITÔ GIÁO",
      short: "PHẦN II",
      title: "Cử Hành Mầu Nhiệm Phụng Vụ",
      subtitle: "Bảy Bí Tích Cứu Độ",
      color: "emerald",
      sections: [
        {
          name: "Mục thứ nhất: Nhiệm cục Bí tích",
          chapters: [
            {
              name: "Chương một: Mầu nhiệm Vượt Qua trong đời sống của Hội Thánh",
              lessons: getLessonsRange(31, 32)
            },
            {
              name: "Chương hai: Cử hành mầu nhiệm Vượt Qua",
              lessons: getLessonsRange(33, 34)
            }
          ],
          lessonsWithoutChapter: cleanLessonList([getLessonObj(30)]) // Lesson 30 - Phụng vụ
        },
        {
          name: "Mục thứ hai: Bảy Bí tích của Hội Thánh",
          chapters: [
            {
              name: "Chương một: Các Bí tích Khai tâm Kitô giáo (Rửa Tội, Thêm Sức, Thánh Thể)",
              lessons: getLessonsRange(36, 38)
            },
            {
              name: "Chương hai: Các Bí tích Chữa lành (Giải Tội, Xức Dầu Bệnh Nhân)",
              lessons: getLessonsRange(39, 40)
            },
            {
              name: "Chương ba: Các Bí tích Phục vụ sự hiệp thông và sứ vụ (Truyền Chức Thánh, Hôn Phối)",
              lessons: getLessonsRange(41, 43)
            },
            {
              name: "Chương bốn: Những cử hành phụng vụ khác (Á bí tích, An táng...)",
              lessons: getLessonsRange(44, 44)
            }
          ],
          lessonsWithoutChapter: cleanLessonList([getLessonObj(35)]) // Lesson 35 - Bảy Bí tích của Hội Thánh
        }
      ]
    },
    {
      name: "PHẦN THỨ BA: ĐỜI SỐNG TRONG ĐỨC KITÔ",
      short: "PHẦN III",
      title: "Đời Sống Trong Đức Kitô",
      subtitle: "Mười Điều Răn & Luân Lý",
      color: "violet",
      sections: [
        {
          name: "Mục thứ nhất: Ơn gọi của con người: Đời sống trong Chúa Thánh Thần",
          chapters: [
            {
              name: "Chương một: Phẩm giá con người",
              lessons: getLessonsRange(45, 51)
            },
            {
              name: "Chương hai: Cộng đồng nhân loại",
              lessons: getLessonsRange(52, 54)
            },
            {
              name: "Chương ba: Ơn cứu độ của Thiên Chúa: Lề luật và Ân sủng",
              lessons: getLessonsRange(55, 57)
            }
          ],
          lessonsWithoutChapter: []
        },
        {
          name: "Mục thứ hai: Mười Điều Răn",
          chapters: [
            {
              name: "Chương một: “Ngươi phải yêu mến Đức Chúa, Thiên Chúa của ngươi, hết lòng, hết linh hồn và hết trí khôn ngươi” (Điều răn 1, 2, 3)",
              lessons: getLessonsRange(59, 61)
            },
            {
              name: "Chương hai: “Ngươi phải yêu thương người thân cận như chính mình” (Điều răn từ 4 đến 10)",
              lessons: getLessonsRange(62, 69)
            }
          ],
          lessonsWithoutChapter: cleanLessonList([getLessonObj(58)]) // Lesson 58 - Mười Điều Răn
        }
      ]
    },
    {
      name: "PHẦN THỨ TƯ: KINH NGUYỆN KITÔ GIÁO",
      short: "PHẦN IV",
      title: "Kinh Nguyện Kitô Giáo",
      subtitle: "Đời Sống Cầu Nguyện & Lời Kinh Cha",
      color: "amber",
      sections: [
        {
          name: "Mục thứ nhất: Kinh nguyện trong đời sống Kitô giáo",
          chapters: [
            {
              name: "Chương một: Mặc khải về cầu nguyện",
              lessons: getLessonsRange(70, 71)
            },
            {
              name: "Chương hai: Truyền thống cầu nguyện",
              lessons: getLessonsRange(72, 72)
            },
            {
              name: "Chương ba: Đời sống cầu nguyện",
              lessons: getLessonsRange(73, 73)
            }
          ],
          lessonsWithoutChapter: []
        },
        {
          name: "Mục thứ hai: Kinh nguyện của Chúa: Kinh Lạy Cha",
          chapters: [],
          lessonsWithoutChapter: getLessonsRange(74, 75) // Lessons 74, 75
        }
      ]
    }
  ];
}
