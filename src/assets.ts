import forestUrl from "./assets/forest.jpg";
import sceneUrl from "./assets/scene.jpg";

/**
 * Ваша настоящая фотография: положите файл в  src/assets/couple.jpg
 * (допустимы также .jpeg / .png / .webp). Он автоматически станет главным кадром.
 * Если файла нет — используется сгенерированная сцена scene.jpg.
 */
const coupleModules = import.meta.glob("./assets/couple.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const coupleUrl: string | undefined = Object.values(coupleModules)[0];

export { forestUrl, sceneUrl, coupleUrl };
