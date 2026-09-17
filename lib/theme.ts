export type Theme = "light" | "dark";

export const THEME_KEY = "fl-theme";

// Выполняется в <head> до отрисовки, чтобы сохранённая тема применилась без мигания
export const themeInitScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;
