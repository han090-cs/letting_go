// All user-facing text. Burmese lives in ./my.ts; languages without a key fall back to English.
import {copyMy,extraMy,aboutMy} from './my';

export type Lang = 'en'|'my'|'ja'|'zh'|'ar'|'es'|'fr'|'ko';
export const LANGS:Lang[]=['en','my','ja','zh','ar','es','fr','ko'];

export interface Copy {
  eyebrow:string; headline:string; subhead:string; placeholder:string; privacy:string; drop:string;
  hint:string; counter:string; reflection:string; fire:string; fireDesc:string; water:string; waterDesc:string;
  wind:string; windDesc:string; grounding:string; fresh:string; footer:string; nothing:string;
  inhale:string; hold:string; exhale:string; typed:string;
}

const COPY_BASE: Record<Exclude<Lang,'my'>, Copy> = {
  en:{eyebrow:'A quiet place to put it down.',headline:"You don't have to carry everything.",subhead:'Write what feels heavy. Nothing is saved. Nothing is judged.',placeholder:'Write down what weighs on your mind...',privacy:'Private · ephemeral · no account',drop:'Drop it',hint:'Press Enter to drop · Shift + Enter for a new line',counter:'Weight accumulating…',reflection:'You have witnessed the weight of your thoughts.<br>How would you like to release them?',fire:'Burn to Ash',fireDesc:'For anger & resentment',water:'Ocean Tide',waterDesc:'For grief & longing',wind:'Blow with the Wind',windDesc:'For anxiety & overwhelm',grounding:'Take a slow, full breath. You can set this weight down.',fresh:'Start Fresh',footer:'Nothing you write is uploaded, stored, or tracked.',nothing:'Nothing has to be carried right now.',inhale:'Inhale',hold:'Hold',exhale:'Exhale',typed:'thoughts'},
  ja:{eyebrow:'ここに、そっと置いていきましょう。',headline:'すべてを抱えなくていい。',subhead:'重く感じることを書いてください。保存も評価もしません。',placeholder:'心に重くのしかかっていることを書いてください…',privacy:'プライベート · 一時的 · アカウント不要',drop:'手放す',hint:'Enterで手放す · Shift + Enterで改行',counter:'重さが積み重なっています…',reflection:'あなたは心の重さを目の前にしました。<br>どうやって手放したいですか？',fire:'灰にする',fireDesc:'怒りやわだかまりに',water:'潮に流す',waterDesc:'悲しみや恋しさに',wind:'風に託す',windDesc:'不安や圧倒される感覚に',grounding:'ゆっくり深く息を吸って。もう、この重さを抱えなくていい。',fresh:'最初から',footer:'入力内容は送信・保存・追跡されません。',nothing:'今は何も背負わなくていい。',inhale:'吸う',hold:'止める',exhale:'吐く',typed:'思い'},
  zh:{eyebrow:'把它轻轻放在这里。',headline:'你不必一个人扛下所有事。',subhead:'写下让你沉重的事。不会保存，也不会评判。',placeholder:'写下此刻压在心上的事……',privacy:'私密 · 临时 · 无需账号',drop:'放下',hint:'按 Enter 放下 · Shift + Enter 换行',counter:'重量正在堆积……',reflection:'你已经看见了这些念头的重量。<br>你想怎样放下它们？',fire:'化为灰烬',fireDesc:'适合愤怒与怨念',water:'随潮而去',waterDesc:'适合悲伤与思念',wind:'交给风',windDesc:'适合焦虑与不知所措',grounding:'慢慢深呼吸。你可以把这份重量放下。',fresh:'重新开始',footer:'你写下的内容不会上传、保存或追踪。',nothing:'现在不必背负任何东西。',inhale:'吸气',hold:'屏息',exhale:'呼气',typed:'念头'},
  ar:{eyebrow:'مكان هادئ لتضع فيه ما يثقل عليك.',headline:'لست مضطرًا لحمل كل شيء.',subhead:'اكتب ما يثقل قلبك. لن يتم حفظه أو الحكم عليه.',placeholder:'اكتب ما يثقل ذهنك…',privacy:'خاص · مؤقت · بلا حساب',drop:'اتركه',hint:'Enter لتركه · Shift + Enter لسطر جديد',counter:'العبء يتراكم…',reflection:'لقد رأيت ثقل أفكارك أمامك.<br>كيف تريد أن تطلقها؟',fire:'حوّله إلى رماد',fireDesc:'للغضب والاستياء',water:'مع المدّ',waterDesc:'للحزن والاشتياق',wind:'مع الريح',windDesc:'للقلق والإرهاق',grounding:'خذ نفسًا بطيئًا وعميقًا. يمكنك وضع هذا الثقل جانبًا.',fresh:'ابدأ من جديد',footer:'ما تكتبه لا يُرفع ولا يُحفظ ولا يُتتبع.',nothing:'لا شيء عليك حمله الآن.',inhale:'شهيق',hold:'احبس',exhale:'زفير',typed:'أفكار'},
  es:{eyebrow:'Un lugar tranquilo para dejarlo aquí.',headline:'No tienes que cargar con todo.',subhead:'Escribe lo que pesa. Nada se guarda. Nada se juzga.',placeholder:'Escribe lo que pesa en tu mente…',privacy:'Privado · efímero · sin cuenta',drop:'Soltar',hint:'Enter para soltar · Shift + Enter para una línea nueva',counter:'El peso se acumula…',reflection:'Has visto el peso de tus pensamientos.<br>¿Cómo quieres liberarlo?',fire:'Convertir en cenizas',fireDesc:'Para ira y resentimiento',water:'Dejarlo ir con la marea',waterDesc:'Para tristeza y añoranza',wind:'Confiarlo al viento',windDesc:'Para ansiedad y agobio',grounding:'Respira lenta y profundamente. Puedes dejar este peso aquí.',fresh:'Empezar de nuevo',footer:'Lo que escribes no se sube, guarda ni rastrea.',nothing:'Ahora no tienes que cargar con nada.',inhale:'Inhala',hold:'Mantén',exhale:'Exhala',typed:'pensamientos'},
  fr:{eyebrow:'Un endroit calme où déposer ce qui pèse.',headline:"Tu n'as pas à tout porter.",subhead:'Écris ce qui est lourd. Rien n’est enregistré. Rien n’est jugé.',placeholder:'Écris ce qui pèse sur ton esprit…',privacy:'Privé · éphémère · sans compte',drop:'Déposer',hint:'Entrée pour déposer · Shift + Entrée pour une nouvelle ligne',counter:'Le poids s’accumule…',reflection:'Tu viens de voir le poids de tes pensées.<br>Comment veux-tu les laisser partir ?',fire:'Réduire en cendres',fireDesc:'Pour la colère et le ressentiment',water:'Avec la marée',waterDesc:'Pour le chagrin et le manque',wind:'Avec le vent',windDesc:"Pour l'anxiété et le trop-plein",grounding:'Respire lentement et profondément. Tu peux déposer ce poids ici.',fresh:'Recommencer',footer:'Ce que tu écris n’est ni envoyé, ni stocké, ni suivi.',nothing:'Tu n’as rien à porter maintenant.',inhale:'Inspire',hold:'Garde',exhale:'Expire',typed:'pensées'},
  ko:{eyebrow:'여기에 잠시 내려놓아도 괜찮아요.',headline:'모든 것을 혼자 짊어질 필요는 없어요.',subhead:'마음이 무거운 것을 적어보세요. 저장하거나 판단하지 않아요.',placeholder:'지금 마음을 무겁게 하는 것을 적어보세요…',privacy:'비공개 · 일시적 · 계정 불필요',drop:'내려놓기',hint:'Enter로 내려놓기 · Shift + Enter로 줄바꿈',counter:'마음의 무게가 쌓이고 있어요…',reflection:'생각의 무게를 눈앞에서 바라보았어요.<br>이제 어떻게 놓아주고 싶나요?',fire:'재로 보내기',fireDesc:'분노와 원망을 위해',water:'물결에 보내기',waterDesc:'슬픔과 그리움을 위해',wind:'바람에 보내기',windDesc:'불안과 압도감을 위해',grounding:'천천히 깊게 숨을 쉬어요. 이제 이 무게를 내려놓아도 괜찮아요.',fresh:'처음부터',footer:'작성한 내용은 업로드·저장·추적되지 않아요.',nothing:'지금은 아무것도 짊어지지 않아도 돼요.',inhale:'들이마시기',hold:'멈추기',exhale:'내쉬기',typed:'생각'}
};


export interface ExtraCore{lonely:string;guilty:string;hurt:string;overwhelmed:string;sub:string;done:string;again:string;start:string;s1:string;s2:string;s3:string;tap:string;feel:string;angry:string;sad:string;anxious:string;tired:string;weight:string;light:string;heavy:string;letgo:string;more:string;after:string;better:string;same:string;support:string;crisis:string;choose:string}
const EXTRA_BASE:Record<Exclude<Lang,'my'>,ExtraCore&Partial<Extra2>>={
  en:{lonely:'Lonely',guilty:'Guilty',hurt:'Hurt',overwhelmed:'Overwhelmed',sub:'Write it out, let it go, then get back to your day. Nothing is saved. Nothing is judged.',done:'It is set down. You can go back to your day now.',again:'Write something else',start:'Not sure where to start?',s1:'Right now I feel…',s2:'What has been weighing on me is…',s3:'I wish I could say…',tap:'Tap a word to let it go. Drag or tilt to move them.',feel:'What is the strongest feeling?',angry:'Angry',sad:'Sad',anxious:'Anxious',tired:'Tired',weight:'How heavy does it feel right now?',light:'Light',heavy:'Heavy',letgo:'Let it go',more:'Anything else?',after:'And how does it feel now?',better:'Notice that shift. You made some room.',same:'That is okay. One try does not have to finish it.',support:'Need someone to talk to?',crisis:'That sounds really heavy. You deserve support from a real person. Please reach out to someone you trust, or a local helpline.',choose:'How would you like to release it?'},
  ja:{lonely:'孤独',guilty:'罪悪感',hurt:'傷ついた',overwhelmed:'圧倒される',sub:'書いて、手放して、また日常へ。何も保存されず、誰も評価しません。',done:'置くことができました。いつもの一日に戻って大丈夫です。',again:'もう一度書く',start:'どこから始める？',s1:'いま感じているのは…',s2:'重くのしかかっているのは…',s3:'言えなかったのは…',tap:'ことばをタップすると手放せます。ドラッグや傾きで動かせます。',feel:'いちばん強い気持ちは？',angry:'怒り',sad:'悲しみ',anxious:'不安',tired:'疲れ',weight:'今、どのくらい重く感じますか？',light:'軽い',heavy:'重い',letgo:'手放す',more:'ほかにありますか？',after:'今はどう感じますか？',better:'その変化に気づいてみて。少し余白ができました。',same:'大丈夫。一度で終わらせなくていい。',support:'話せる相手が必要ですか？',crisis:'とても重い気持ちですね。生身の人のサポートを受けてほしいです。信頼できる人か、地域の相談窓口に連絡してください。',choose:'どう手放したいですか？'},
  zh:{lonely:'孤独',guilty:'内疚',hurt:'受伤',overwhelmed:'不堪重负',sub:'写下来，放下它，然后回到你的日子里。不保存，不评判。',done:'已经放下了。你可以回到自己的生活了。',again:'再写一次',start:'不知从何说起？',s1:'此刻我感觉…',s2:'压在我心上的是…',s3:'我没能说出口的是…',tap:'点按词语即可放下；拖动或倾斜手机可移动它们。',feel:'此刻最强烈的感受是？',angry:'愤怒',sad:'悲伤',anxious:'焦虑',tired:'疲惫',weight:'此刻感觉有多沉重？',light:'轻',heavy:'重',letgo:'放下',more:'还有别的吗？',after:'现在感觉如何？',better:'留意这份变化。你腾出了一点空间。',same:'没关系。一次不必解决所有事。',support:'需要有人倾诉吗？',crisis:'这听起来真的很沉重。你值得获得真实的人的支持。请联系信任的人或当地求助热线。',choose:'你想怎样放下它？'},
  ar:{lonely:'وحيد',guilty:'مذنب',hurt:'مجروح',overwhelmed:'مُثقَل',sub:'اكتب، ثم اتركه، ثم عد إلى يومك. لا شيء يُحفظ ولا أحد يحكم عليك.',done:'لقد وضعته جانبًا. يمكنك العودة إلى يومك الآن.',again:'اكتب شيئًا آخر',start:'لا تعرف من أين تبدأ؟',s1:'أشعر الآن بـ…',s2:'ما يثقل عليّ هو…',s3:'ما لم أستطع قوله هو…',tap:'اضغط على كلمة لتتركها. اسحب أو أمِل الجهاز لتحريكها.',feel:'ما أقوى شعور لديك؟',angry:'غاضب',sad:'حزين',anxious:'قلق',tired:'متعب',weight:'ما مدى ثقل ما تشعر به الآن؟',light:'خفيف',heavy:'ثقيل',letgo:'اتركه',more:'هل هناك شيء آخر؟',after:'وكيف تشعر الآن؟',better:'لاحظ هذا التغيّر. لقد أفسحت بعض المجال.',same:'لا بأس. محاولة واحدة لا يجب أن تنهي كل شيء.',support:'هل تحتاج إلى من تتحدث إليه؟',crisis:'يبدو هذا ثقيلًا حقًا. أنت تستحق دعم شخص حقيقي. تواصل مع شخص تثق به أو مع خط مساعدة محلي.',choose:'كيف تريد أن تطلقه؟'},
  es:{lonely:'Soledad',guilty:'Culpa',hurt:'Dolido',overwhelmed:'Abrumado',sub:'Escríbelo, suéltalo y vuelve a tu día. No se guarda nada. Nadie juzga.',done:'Ya lo has dejado. Puedes volver a tu día.',again:'Escribir otra cosa',start:'¿No sabes por dónde empezar?',s1:'Ahora mismo siento…',s2:'Lo que más me pesa es…',s3:'Ojalá pudiera decir…',tap:'Toca una palabra para soltarla. Arrastra o inclina para moverlas.',feel:'¿Cuál es el sentimiento más fuerte?',angry:'Enfado',sad:'Tristeza',anxious:'Ansiedad',tired:'Cansancio',weight:'¿Cuánto pesa ahora mismo?',light:'Ligero',heavy:'Pesado',letgo:'Soltar',more:'¿Algo más?',after:'¿Y ahora cómo se siente?',better:'Fíjate en ese cambio. Has hecho algo de espacio.',same:'Está bien. Un intento no tiene que resolverlo todo.',support:'¿Necesitas hablar con alguien?',crisis:'Suena muy pesado. Mereces el apoyo de una persona real. Habla con alguien de confianza o con una línea de ayuda local.',choose:'¿Cómo quieres soltarlo?'},
  fr:{lonely:'Seul',guilty:'Coupable',hurt:'Blessé',overwhelmed:'Dépassé',sub:'Écris-le, lâche-le, puis reprends ta journée. Rien n’est enregistré. Personne ne juge.',done:'C’est posé. Tu peux reprendre ta journée.',again:'Écrire autre chose',start:'Pas sûr de par où commencer ?',s1:'En ce moment, je ressens…',s2:'Ce qui me pèse, c’est…',s3:'J’aimerais pouvoir dire…',tap:'Touche un mot pour le lâcher. Fais glisser ou incline pour les déplacer.',feel:'Quelle est l’émotion la plus forte ?',angry:'Colère',sad:'Tristesse',anxious:'Anxiété',tired:'Fatigue',weight:'À quel point est-ce lourd maintenant ?',light:'Léger',heavy:'Lourd',letgo:'Lâcher prise',more:'Autre chose ?',after:'Et maintenant, comment te sens-tu ?',better:'Remarque ce changement. Tu as fait un peu de place.',same:'C’est normal. Un essai n’a pas à tout régler.',support:'Besoin de parler à quelqu’un ?',crisis:'Cela semble vraiment lourd. Tu mérites le soutien d’une vraie personne. Parle à quelqu’un de confiance ou à une ligne d’écoute locale.',choose:'Comment veux-tu le libérer ?'},
  ko:{lonely:'외로움',guilty:'죄책감',hurt:'상처',overwhelmed:'벅참',sub:'적고, 놓아주고, 다시 하루로 돌아가세요. 아무것도 저장되지 않고 누구도 판단하지 않아요.',done:'내려놓았어요. 이제 하루로 돌아가도 괜찮아요.',again:'다른 이야기 쓰기',start:'어디서 시작할지 모르겠나요?',s1:'지금 나는…',s2:'나를 짓누르는 건…',s3:'말하지 못한 건…',tap:'단어를 탭하면 놓아줄 수 있어요. 드래그하거나 기울여 움직일 수 있어요.',feel:'가장 강한 감정은 무엇인가요?',angry:'분노',sad:'슬픔',anxious:'불안',tired:'피곤',weight:'지금 얼마나 무겁게 느껴지나요?',light:'가벼움',heavy:'무거움',letgo:'놓아주기',more:'더 있나요?',after:'지금은 어떤가요?',better:'그 변화를 알아차려 보세요. 조금 공간이 생겼어요.',same:'괜찮아요. 한 번에 모두 끝낼 필요는 없어요.',support:'이야기할 사람이 필요한가요?',crisis:'정말 무겁게 들려요. 실제 사람의 도움을 받을 자격이 있어요. 믿을 수 있는 사람이나 지역 상담전화에 연락해 보세요.',choose:'어떻게 놓아주고 싶나요?'}
};

/** Newer strings. Only English and Burmese are translated; other languages fall back to English. */
export interface Extra2{
  breathe:string;breathDone:string;close:string;
  feedbackT:string;feedbackP:string;mailApp:string;mailWeb:string;mailCopy:string;copied:string;
  mailSubject:string;mailHello:string;mailPrompt:string;mailInfo:string;
  creatorT:string;creatorP:string;installT:string;installP:string;installBtn:string;installIos:string;
  version:string;announceAdded:string;announceRest:string;helpT:string;helpP:string;nudge:string;wipe:string;
  wishBtn:string;wishQ:string;wishPh:string;wishGo:string;wishSent:string;wishDone:string;wishAnnounce:string;w1:string;w2:string;w3:string;w4:string;wishNudge:string;
}
export type Extra=ExtraCore&Extra2;

const EN2:Extra2={
  breathe:'Breathe with me',breathDone:'That is enough. Well done.',close:'Close',
  feedbackT:'Feedback',feedbackP:'Found a problem or have an idea? Email the creator. You never need to include anything you wrote here.',
  mailApp:'Send with email app',mailWeb:'Open in Gmail',mailCopy:'Copy email address',copied:'Copied',
  mailSubject:'Letting Go feedback',mailHello:'Hello,',mailPrompt:'My feedback or the problem I found:',
  mailInfo:'Technical info (helps with fixing; delete it if you prefer)',
  creatorT:'Creator',creatorP:'Open source on GitHub.',
  installT:'Keep it on your device',installP:'Add it to your home screen and it also works offline.',installBtn:'Add to home screen',
  installIos:'On iPhone or iPad, tap the Share button in Safari and choose “Add to Home Screen”.',
  version:'Version',announceAdded:'Your words are on the screen. Tap a word to release it.',announceRest:'Released.',
  helpT:'Support',helpP:'',
  nudge:'You have been here a while. If it feels lighter, you can drink some water and head back to your day. You are welcome to return any time.',wipe:'Clear everything now',
  wishBtn:'Float a wish lantern',wishQ:'Write a wish or a prayer on your lantern. It will rise into the night sky.',wishPh:'May…',wishGo:'Release lantern',
  wishSent:'May it come true. Write another if you like.',wishDone:'Done',wishAnnounce:'Your lantern is rising.',
  w1:'May my family be safe',w2:'May I find peace',w3:'May I be well',w4:'May tomorrow be kind',
  wishNudge:'You have set that down. Would you like to make one good wish for yourself?'
};

export interface About{title:string;purposeT:string;purpose:string;privT:string;priv:string;howT:string;how:string[];note:string}
const ABOUT_BASE:Record<string,About>={
  en:{title:'About Letting Go',purposeT:'Why this exists',
    purpose:'A quiet place to put down what feels heavy, without telling anyone and without being judged. For the thoughts that are hard to say out loud. It is an outlet, not a place to stay: come, write it out, let it go, and head back out lighter.',
    privT:'Privacy',priv:'No account. Nothing you write is saved, sent or tracked. It is temporary: close the page and it is gone. The only thing remembered on this device is your language choice.',
    howT:'How it can help',
    how:['Writing it out. Getting swirling thoughts into words often makes them feel clearer. Research on expressive writing suggests it can help some people.',
      'Naming the feeling. Saying "this is anger" can take a little of the intensity out of it.',
      'Seeing it and releasing it. Watching your words burn, drift on water or blow away gives the feeling that you are allowed to set it down. Some small studies suggest that symbolically throwing away what you wrote can loosen its hold.',
      'Slow breathing. Making the out-breath longer than the in-breath helps the body settle.',
      'Wish lanterns. After letting go, you can write a wish or a prayer on a lantern and watch it rise into the night sky. It is gone the moment it leaves the screen.',
      'No pressure. No timer, no history, no score. Write as much as you like and release when you are ready.'],
    note:'This is not therapy or treatment. If things feel too heavy, please talk to someone you trust or a professional. If you are in danger, contact your local emergency service right away.'},
};

EXTRA_BASE.en={...EXTRA_BASE.en,...EN2};


// Wish-lantern strings for the languages that have no full translation file.
const WISH_TR:Partial<Record<Lang,Partial<Extra2>>>={
  ja:{wishBtn:'願いのランタンを飛ばす',wishQ:'ランタンに願いや祈りを書いてください。夜空へゆっくり昇っていきます。',wishPh:'どうか…',wishGo:'ランタンを放つ',wishSent:'願いが叶いますように。続けて書いても大丈夫です。',wishDone:'完了',wishAnnounce:'ランタンが昇っています。',w1:'家族が無事でありますように',w2:'心が穏やかになりますように',w3:'健康でいられますように',w4:'明日が優しい日になりますように',wishNudge:'重さを置けました。自分のために、ひとつ願いごとをしてみませんか？'},
  zh:{wishBtn:'放飞许愿天灯',wishQ:'在天灯上写下心愿或祈祷，它会缓缓升向夜空。',wishPh:'愿…',wishGo:'放飞天灯',wishSent:'愿心愿成真。想再写一个也可以。',wishDone:'完成',wishAnnounce:'天灯正在升空。',w1:'愿家人平安',w2:'愿内心平静',w3:'愿身体健康',w4:'愿明天温柔以待',wishNudge:'你已经放下了。要不要为自己许一个美好的心愿？'},
  ar:{wishBtn:'أطلق فانوس أمنية',wishQ:'اكتب أمنية أو دعاءً على فانوسك. سيرتفع ببطء نحو سماء الليل.',wishPh:'ليت…',wishGo:'أطلق الفانوس',wishSent:'أتمنى أن تتحقق أمنيتك. يمكنك كتابة أخرى إن شئت.',wishDone:'تم',wishAnnounce:'الفانوس يرتفع الآن.',w1:'أن تكون عائلتي بخير',w2:'أن أجد السلام',w3:'أن أكون بصحة جيدة',w4:'أن يكون الغد لطيفًا',wishNudge:'لقد وضعت ذلك جانبًا. هل تودّ أن تتمنى أمنية جميلة لنفسك؟'},
  es:{wishBtn:'Soltar un farol de deseos',wishQ:'Escribe un deseo o una oración en tu farol. Subirá despacio al cielo nocturno.',wishPh:'Ojalá…',wishGo:'Soltar farol',wishSent:'Ojalá se cumpla. Puedes escribir otro si quieres.',wishDone:'Listo',wishAnnounce:'Tu farol está subiendo.',w1:'Que mi familia esté a salvo',w2:'Que encuentre paz',w3:'Que esté bien',w4:'Que mañana sea amable',wishNudge:'Ya lo has dejado. ¿Quieres pedir un deseo bonito para ti?'},
  fr:{wishBtn:'Lâcher une lanterne de vœux',wishQ:'Écris un vœu ou une prière sur ta lanterne. Elle montera doucement dans le ciel nocturne.',wishPh:'Que…',wishGo:'Lâcher la lanterne',wishSent:'Que cela se réalise. Tu peux en écrire un autre.',wishDone:'Terminé',wishAnnounce:'Ta lanterne s’élève.',w1:'Que ma famille soit en sécurité',w2:'Que je trouve la paix',w3:'Que j’aille bien',w4:'Que demain soit doux',wishNudge:'C’est posé. Veux-tu faire un vœu doux pour toi ?'},
  ko:{wishBtn:'소원 등불 띄우기',wishQ:'등불에 소원이나 기도를 적어 보세요. 천천히 밤하늘로 올라가요.',wishPh:'부디…',wishGo:'등불 띄우기',wishSent:'소원이 이루어지길. 하나 더 써도 좋아요.',wishDone:'완료',wishAnnounce:'등불이 올라가고 있어요.',w1:'가족이 안전하기를',w2:'마음이 평안해지기를',w3:'건강하기를',w4:'내일은 다정하기를',wishNudge:'내려놓았어요. 나를 위해 소원 하나 빌어 볼까요?'}
};
export const COPY:Record<Lang,Copy>={...COPY_BASE,my:copyMy};
const EXTRA:Record<Lang,ExtraCore&Partial<Extra2>>={...EXTRA_BASE,my:extraMy};
export const ABOUT:Record<string,About>={...ABOUT_BASE,my:aboutMy};

/** Merge order: English defaults, then the chosen language on top. */
export const text=(lang:Lang):Copy&Extra=>({...COPY.en,...EXTRA_BASE.en as Extra,...COPY[lang],...EXTRA[lang],...WISH_TR[lang]} as Copy&Extra);
