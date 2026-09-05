import { analyzeTaste } from "./taste-profile.js?v=20260905";
import { genreName } from "./i18n.js?v=20260904a";

// Keep profile copy together; all supported site locales use the same fields.
export const profileCopy = {
  ja: ["好みのプロフィール", "知識", "創作", "刺激", "物語", "癒やし", "暮らし・旅", "ミックスタイプ", "{axis}中心タイプ", "分析した動画", "ジャンル", "少数サンプル・暫定プロフィール", "お気に入りから、あなたの好みの形が見えてくる。", "動画のハートを押すと、ここにプロフィールが育ちます。", "ジャンル構成", "保存済み{total}本中{count}本を分析。未取得・未分類の{excluded}本は対象外。", "各値は分析対象の動画に占める割合（四捨五入）。子ジャンルは親の分類を継承します。全ての国のお気に入りを使用し、履歴・再生数は使いません。", "動画ジャンルから作る娯楽用の好み分析です。性格や能力を診断するものではありません。分析はこのブラウザー内で完結します。", "分析できるお気に入りがありません。別の動画を追加すると表示されます。"],
  en: ["Taste profile", "Knowledge", "Creation", "Excitement", "Stories", "Calm", "Life & travel", "Mixed taste", "{axis} focused", "Videos analyzed", "Genres", "Small sample · provisional", "Your favorites give your taste a shape.", "Save videos with the heart to build your profile.", "Genre mix", "Analyzed {count} of {total} saved videos. {excluded} unavailable or unclassified videos excluded.", "Each value is a rounded share of analyzed videos. Subgenres inherit their parent category. Favorites from all countries count; history and view counts do not.", "A playful analysis of video genres, not a personality or ability assessment. Analysis stays in this browser.", "No favorites can be analyzed yet. Try saving another video."],
  ko: ["취향 프로필", "지식", "창작", "자극", "이야기", "힐링", "생활·여행", "혼합 취향", "{axis} 중심", "분석한 영상", "장르", "표본 부족 · 임시", "즐겨찾기가 취향의 모양을 만듭니다.", "하트를 눌러 영상을 저장해 보세요.", "장르 구성", "저장한 {total}개 중 {count}개 분석. 누락·미분류 {excluded}개 제외.", "분석 영상의 비율을 반올림합니다. 하위 장르는 상위 분류를 따릅니다. 모든 국가의 즐겨찾기를 사용하며 기록과 조회수는 제외합니다.", "영상 장르에 기반한 재미용 분석이며 성격이나 능력 진단이 아닙니다. 이 브라우저 안에서만 분석합니다.", "분석할 즐겨찾기가 없습니다. 다른 영상을 저장해 보세요."],
  fr: ["Profil de goûts", "Savoirs", "Création", "Sensations", "Récits", "Détente", "Vie et voyage", "Goûts mixtes", "Dominante : {axis}", "Vidéos analysées", "Genres", "Petit échantillon · provisoire", "Vos favoris dessinent vos goûts.", "Enregistrez des vidéos avec le cœur pour créer votre profil.", "Répartition des genres", "{count} vidéos analysées sur {total}. {excluded} indisponibles ou non classées exclues.", "Parts arrondies des vidéos analysées. Les sous-genres suivent leur catégorie parente. Tous les pays comptent, sans historique ni nombre de vues.", "Analyse ludique des genres, pas un diagnostic de personnalité ou de capacités. Le calcul reste dans ce navigateur.", "Aucun favori analysable. Enregistrez une autre vidéo."],
  it: ["Profilo dei gusti", "Conoscenza", "Creazione", "Emozioni", "Storie", "Relax", "Vita e viaggi", "Gusti misti", "Preferenza: {axis}", "Video analizzati", "Generi", "Pochi dati · provvisorio", "I preferiti danno forma ai tuoi gusti.", "Salva video con il cuore per creare il tuo profilo.", "Mix di generi", "Analizzati {count} di {total} video. Esclusi {excluded} non disponibili o non classificati.", "Percentuali arrotondate dei video analizzati. I sottogeneri ereditano la categoria madre. Contano tutti i paesi, non cronologia o visualizzazioni.", "Analisi ludica dei generi, non una valutazione di personalità o capacità. Il calcolo resta in questo browser.", "Nessun preferito analizzabile. Salva un altro video."],
  hi: ["पसंद की प्रोफ़ाइल", "ज्ञान", "सृजन", "रोमांच", "कहानियाँ", "सुकून", "जीवन और यात्रा", "मिश्रित पसंद", "{axis} प्रधान", "विश्लेषित वीडियो", "शैलियाँ", "छोटा नमूना · अस्थायी", "आपके पसंदीदा वीडियो आपकी पसंद का आकार बनाते हैं।", "प्रोफ़ाइल बनाने के लिए दिल दबाकर वीडियो सहेजें।", "शैली मिश्रण", "{total} में से {count} वीडियो का विश्लेषण। अनुपलब्ध या अवर्गीकृत {excluded} बाहर।", "मान विश्लेषित वीडियो के पूर्णांक प्रतिशत हैं। उपशैलियाँ मूल वर्ग अपनाती हैं। सभी देशों के पसंदीदा शामिल हैं; इतिहास और व्यू नहीं।", "यह वीडियो शैलियों का मनोरंजक विश्लेषण है, व्यक्तित्व या क्षमता की जाँच नहीं। विश्लेषण इसी ब्राउज़र में रहता है।", "विश्लेषण योग्य पसंदीदा नहीं हैं। कोई और वीडियो सहेजें।"],
  "pt-BR": ["Perfil de gostos", "Conhecimento", "Criação", "Emoção", "Histórias", "Calma", "Vida e viagens", "Gostos mistos", "Foco: {axis}", "Vídeos analisados", "Gêneros", "Amostra pequena · provisório", "Seus favoritos dão forma aos seus gostos.", "Salve vídeos com o coração para criar seu perfil.", "Mix de gêneros", "{count} de {total} vídeos analisados. {excluded} indisponíveis ou sem classificação excluídos.", "Percentuais arredondados dos vídeos analisados. Subgêneros seguem a categoria principal. Favoritos de todos os países contam; histórico e visualizações não.", "Análise divertida de gêneros, não uma avaliação de personalidade ou capacidade. O cálculo fica neste navegador.", "Nenhum favorito pode ser analisado. Salve outro vídeo."],
  de: ["Geschmacksprofil", "Wissen", "Kreation", "Spannung", "Geschichten", "Ruhe", "Leben & Reisen", "Gemischter Geschmack", "Schwerpunkt: {axis}", "Analysierte Videos", "Genres", "Kleine Stichprobe · vorläufig", "Deine Favoriten geben deinem Geschmack eine Form.", "Speichere Videos mit dem Herz, um dein Profil aufzubauen.", "Genre-Mix", "{count} von {total} Videos analysiert. {excluded} fehlende oder nicht zugeordnete ausgeschlossen.", "Gerundete Anteile der analysierten Videos. Untergenres folgen ihrer Hauptkategorie. Favoriten aller Länder zählen, Verlauf und Aufrufzahlen nicht.", "Spielerische Genre-Analyse, keine Beurteilung von Persönlichkeit oder Fähigkeiten. Die Analyse bleibt in diesem Browser.", "Keine auswertbaren Favoriten. Speichere ein anderes Video."],
  es: ["Perfil de gustos", "Conocimiento", "Creación", "Emoción", "Historias", "Calma", "Vida y viajes", "Gustos mixtos", "Enfoque: {axis}", "Vídeos analizados", "Géneros", "Muestra pequeña · provisional", "Tus favoritos dan forma a tus gustos.", "Guarda vídeos con el corazón para crear tu perfil.", "Mezcla de géneros", "{count} de {total} vídeos analizados. {excluded} no disponibles o sin clasificar excluidos.", "Porcentajes redondeados de los vídeos analizados. Los subgéneros heredan su categoría principal. Cuentan todos los países, no el historial ni las visitas.", "Análisis lúdico de géneros, no un diagnóstico de personalidad o capacidad. El análisis queda en este navegador.", "No hay favoritos analizables. Guarda otro vídeo."],
  th: ["โปรไฟล์ความชอบ", "ความรู้", "สร้างสรรค์", "ตื่นเต้น", "เรื่องราว", "ผ่อนคลาย", "ชีวิตและเที่ยว", "ความชอบผสม", "เน้น{axis}", "วิดีโอที่วิเคราะห์", "หมวดหมู่", "ตัวอย่างน้อย · ชั่วคราว", "รายการโปรดสร้างรูปแบบความชอบของคุณ", "กดหัวใจบันทึกวิดีโอเพื่อสร้างโปรไฟล์", "สัดส่วนหมวดหมู่", "วิเคราะห์ {count} จาก {total} วิดีโอ ยกเว้น {excluded} รายการที่ไม่มีข้อมูลหรือหมวดหมู่", "ค่าเป็นร้อยละปัดเศษ หมวดย่อยใช้หมวดหลัก รวมรายการโปรดทุกประเทศ ไม่ใช้ประวัติหรือยอดชม", "วิเคราะห์หมวดหมู่เพื่อความสนุก ไม่ใช่การวินิจฉัยบุคลิกหรือความสามารถ ประมวลผลในเบราว์เซอร์นี้เท่านั้น", "ยังไม่มีรายการโปรดที่วิเคราะห์ได้ ลองบันทึกวิดีโออื่น"],
  id: ["Profil selera", "Pengetahuan", "Kreasi", "Sensasi", "Cerita", "Ketenangan", "Hidup & wisata", "Selera campuran", "Fokus: {axis}", "Video dianalisis", "Genre", "Sampel kecil · sementara", "Favorit memberi bentuk pada seleramu.", "Simpan video dengan hati untuk membangun profil.", "Komposisi genre", "{count} dari {total} video dianalisis. {excluded} tidak tersedia atau belum terklasifikasi dikecualikan.", "Persentase video yang dianalisis dibulatkan. Subgenre mengikuti kategori induk. Favorit semua negara dihitung, bukan riwayat atau jumlah tayangan.", "Analisis genre untuk hiburan, bukan penilaian kepribadian atau kemampuan. Analisis tetap di browser ini.", "Belum ada favorit yang dapat dianalisis. Simpan video lain."],
  vi: ["Hồ sơ sở thích", "Kiến thức", "Sáng tạo", "Kịch tính", "Câu chuyện", "Thư giãn", "Sống & du lịch", "Sở thích hỗn hợp", "Thiên về {axis}", "Video đã phân tích", "Thể loại", "Mẫu nhỏ · tạm thời", "Video yêu thích tạo nên hình dáng sở thích của bạn.", "Nhấn trái tim để lưu video và xây dựng hồ sơ.", "Cơ cấu thể loại", "Phân tích {count}/{total} video. Bỏ qua {excluded} video thiếu dữ liệu hoặc chưa phân loại.", "Tỷ lệ video đã phân tích được làm tròn. Thể loại con theo nhóm cha. Dùng yêu thích từ mọi quốc gia, không dùng lịch sử hay lượt xem.", "Phân tích thể loại để giải trí, không đánh giá tính cách hay năng lực. Chỉ xử lý trong trình duyệt này.", "Chưa có video yêu thích có thể phân tích. Hãy lưu video khác."],
};

export function renderTasteProfile(panel, favoriteIds, videos, genres, locale) {
  const copy = profileCopy[locale] ?? profileCopy.en;
  const profile = analyzeTaste(favoriteIds, videos, genres);
  const number = value => new Intl.NumberFormat(locale).format(value);
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  panel.replaceChildren();
  const card = node("div", "taste-card");
  const header = node("div", "taste-heading");
  header.append(node("p", "taste-kicker", "TASTE / PROFILE"));
  const leaderIndex = profile.axes.findIndex(axis => axis.id === profile.leader);
  header.append(node("h3", "taste-title", !profile.analyzed ? copy[12] : leaderIndex < 0 ? copy[7] : copy[8].replace("{axis}", copy[leaderIndex + 1])));
  if (profile.analyzed && profile.provisional) header.append(node("p", "taste-status", copy[11]));
  card.append(header);
  const body = node("div", "taste-body");
  const chart = node("div", "taste-chart");
  // SVG contains only computed numbers; all translated/catalog text uses textContent.
  const point = (index, radius) => [180 + Math.sin(index * Math.PI / 3) * radius, 155 - Math.cos(index * Math.PI / 3) * radius];
  const polygon = radius => profile.axes.map((_, i) => point(i, radius).join(",")).join(" ");
  const shape = profile.axes.map((axis, i) => point(i, axis.percent * 1.2).join(",")).join(" ");
  chart.innerHTML = `<svg viewBox="0 0 360 310" aria-hidden="true"><g class="taste-grid">${[30,60,90,120].map(r => `<polygon points="${polygon(r)}"/>`).join("")}${profile.axes.map((_,i) => `<path d="M180 155 L${point(i,120).join(" ")}"/>`).join("")}</g>${profile.analyzed ? `<polygon class="taste-shape" points="${shape}"/>${profile.axes.map((axis,i) => `<circle class="taste-dot" cx="${point(i,axis.percent*1.2)[0]}" cy="${point(i,axis.percent*1.2)[1]}" r="4"/>`).join("")}` : ""}</svg>`;
  profile.axes.forEach((axis, i) => {
    const label = node("span", "taste-chart-label", copy[i + 1]);
    const [x,y] = point(i, 145);
    label.style.left = `${x / 360 * 100}%`;
    label.style.top = `${y / 310 * 100}%`;
    label.setAttribute("aria-hidden", "true");
    chart.append(label);
  });
  body.append(chart);
  const details = node("div", "taste-details");
  const stats = node("div", "taste-stats");
  for (const [value, label] of [[profile.analyzed, copy[9]], [profile.genres.length, copy[10]]]) {
    const stat = node("div", "");
    stat.append(node("strong", "", number(value)), node("span", "", label));
    stats.append(stat);
  }
  details.append(stats);
  if (!profile.analyzed) details.append(node("p", "taste-empty", profile.total ? copy[18] : copy[13]));
  else {
    const list = node("ul", "taste-meters");
    profile.axes.forEach((axis, i) => {
      const item = node("li", "taste-meter");
      item.append(node("span", "", copy[i+1]), node("strong", "", `${number(axis.percent)}%`));
      const track = node("div", "taste-track");
      track.setAttribute("aria-hidden", "true");
      const fill = node("span", "");
      fill.style.width = `${axis.percent}%`;
      track.append(fill); item.append(track); list.append(item);
    });
    details.append(list);
  }
  body.append(details); card.append(body);
  if (profile.analyzed) {
    const mix = node("section", "taste-mix");
    mix.append(node("h4", "", copy[14]));
    const list = node("ul", "taste-genres");
    for (const entry of profile.genres) {
      const genre = genres.find(item => item.id === entry.id);
      const item = node("li", "");
      item.append(node("span", "", genreName(entry.id, locale, genre.name, genre.names)), node("strong", "", `${number(entry.count)} · ${number(entry.percent)}%`));
      list.append(item);
    }
    mix.append(list); card.append(mix);
  }
  const method = node("div", "taste-method");
  method.append(node("p", "", copy[15].replace("{total}", number(profile.total)).replace("{count}", number(profile.analyzed)).replace("{excluded}", number(profile.excluded))));
  method.append(node("p", "", copy[16]), node("p", "", copy[17]));
  card.append(method); panel.append(card);
}
