/* ============================================================
   I18N
   Covers the customer-facing pages only (index/about/faq) — the
   dashboard and login stay English, since only the studio owner
   uses them. Product names/descriptions are NOT translated (they
   come from Firestore as entered by the admin) — only the site's
   own UI chrome and static content (nav, hero, about, faq, chat,
   cart, checkout messages) are translated.

   Usage: call initI18n() once per page after the DOM is ready.
   It applies the saved/default language, wires window.setLang(),
   and every language switch dispatches a "yb:langchange" event on
   window so pages can re-render any JS-built dynamic content.
   ============================================================ */

const LANG_KEY = "yb_lang";
const RTL_LANGS = ["ar"];

const dict = {
  en: {
    nav_shop:"Shop", nav_about:"About", nav_faq:"Shipping & FAQ", cart_bag:"Bag",
    footer_shipping:"Shipping & returns", footer_contact:"Contact", footer_admin:"Studio admin",
    footer_location:"Morocco — made to order", footer_note:"Reserved by me.",

    hero_eyebrow:"Atelier index — established, Morocco",
    hero_welcome_prefix:"Welcome to the", hero_welcome_word:"atelier",
    hero_desc:"Every piece is cut, not printed. No seasons — just a running index of clothing and objects, added to one at a time as they're finished.",
    hero_cta:"Shop the index →",
    hero_fact_clothing_objects:"Clothing & objects", hero_fact_from:"From", hero_fact_ships:"Ships in 5–10 days", hero_fact_morocco:"Morocco",

    label_card_title:"Care & contents", label_contains_key:"Contains", label_contains_val:"Clothing / objects",
    label_filler_key:"Filler", label_filler_val:"None", label_made_key:"Made in", label_made_val:"Morocco",
    label_index_key:"Index", label_care_key:"Care", label_care_val:"Handle as anything hand-made",

    catalog_title:"The Index", catalog_sub_loading:"— loading pieces…", catalog_sub_suffix:"pieces, currently available",
    tab_all:"All", tab_clothing:"Clothing", tab_objects:"Objects",
    add_btn:"Add", added_btn:"Added",

    p_size_label:"Size", p_add_big:"Add to bag", p_meta:"Made to order in Morocco. Allow 5–10 days before dispatch.",

    chat_toggle:"Ask the studio", chat_title:"Studio bot", chat_send:"Send",
    chat_input_placeholder:"Ask about shipping, sizing…",
    chat_greeting:"Salam! I'm the studio bot — ask me about shipping, sizing, returns, or how to reach us.",
    chat_quick_shipping:"Shipping times", chat_quick_sizing:"Sizing", chat_quick_returns:"Returns", chat_quick_contact:"Contact",
    chat_fallback:"I don't have an answer for that yet — the fastest way is to email studio@youssefboukhmiss.com or use the contact form on the Shipping & FAQ page.",
    chat_reply_shipping:"Clothing is made to order — allow 5–10 working days before it ships. Objects like mugs, totes and beanies usually ship within 1–3 working days. Delivery inside Morocco takes 2–4 working days after dispatch.",
    chat_reply_returns:"Objects can be returned within 14 days if unused and in original packaging. Made-to-order clothing can be exchanged for a different size within 14 days, but isn't refundable unless it arrives faulty.",
    chat_reply_sizing:"Cuts run true to size and slightly relaxed. If you're between two sizes, size down for a closer fit or up for roomier. Custom sizing isn't offered at scale yet — message the studio before ordering a made-to-order piece.",
    chat_reply_price:"Prices vary by piece — objects start around 60 MAD, clothing from about 260 MAD. Open the index to see the exact price for each piece.",
    chat_reply_contact:"You can reach the studio at studio@youssefboukhmiss.com or WhatsApp +212 6XX-XXXXXX, Mon–Sat 10:00–18:00. There's also a contact form on the Shipping & FAQ page.",
    chat_reply_location:"Everything is made in Morocco. The studio is open by appointment.",
    chat_reply_damage:"If something arrives damaged or wrong, message the studio with your order number and a photo within 7 days of delivery — it'll be remade or refunded, no questions asked.",
    chat_reply_hi:"Salam! Ask me about shipping, sizing, returns, or how to reach the studio.",

    drawer_title:"Order docket", drawer_stamp:"IN THE BAG", drawer_empty:"— bag is empty —",
    subtotal_label:"Subtotal", checkout_button:"Checkout",
    drawer_note:"Payment on delivery — pay in cash when your order arrives.", remove_btn:"remove",
    checkout_empty:"Your bag is empty.",
    checkout_success:"Order received — payment is cash on delivery. We'll contact you to confirm before it ships.",
    checkout_error:"Something went wrong placing your order. Please try again, or reach the studio directly.",

    page_eyebrow_about:"The atelier", page_title_about:"One name, one index.",
    page_sub_about:"Why there's no \"collection,\" no seasonal drop, and no logo bigger than a stitch.",
    about_h1:"How this started",
    about_p1:"This began as a handful of pieces made for people I knew — a jacket for a friend who kept losing buttons on his old one, a set of mugs for a studio that needed better ones. There was never a plan to build a \"brand.\" There was just a habit of making things properly, and people asking where they could get one too.",
    about_p2:"So instead of a store built around seasons, there's an index. Every piece that gets made gets a number. Nothing is discontinued to make room for something new — if it's in the index, it can still be ordered.",
    about_h2:"Why everything is signed",
    about_p3:"The signature on the homepage isn't a logo — it's the actual mark that goes on every care label, the same way it would go on a letter. If something is wrong with a piece, that signature is a promise it gets fixed, not just a name on a tag.",
    about_h3:"How pieces are made",
    about_p4:"Clothing is cut in small batches in Morocco, mostly to order, which is why lead times run 5–10 days rather than next-day. Objects — mugs, totes, the smaller things — are produced with a short list of local makers whose work has held up over years, not just one wash.",
    about_h4:"What \"no filler\" means",
    about_p5:"Every piece in the index earns its place. Nothing is added just to fill out a size chart or round out a collection page. If a piece stops being good, it comes out of the index rather than staying up out of habit.",

    page_eyebrow_faq:"Before you order", page_title_faq:"Shipping, returns & sizing.",
    page_sub_faq:"Everything worth knowing before a piece leaves the atelier.",
    faq_h_shipping:"Shipping & delivery",
    faq_q1:"How long until my order ships?",
    faq_a1:"Clothing is made to order — allow 5–10 working days before dispatch. Objects (mugs, totes, stickers, beanies) usually ship within 1–3 working days since they're kept in small ready stock.",
    faq_q2:"Where do you deliver?",
    faq_a2:"Nationwide within Morocco in 2–4 working days after dispatch. International orders are handled case by case — get in touch before ordering if you're outside Morocco.",
    faq_q3:"How much does shipping cost?",
    faq_a3:"Flat rate within Morocco. Free on orders over 800 MAD. International rates depend on destination and are quoted before checkout.",
    faq_h_returns:"Returns & exchanges",
    faq_q4:"Can I return something?",
    faq_a4:"Objects can be returned within 14 days if unused and in original packaging. Made-to-order clothing can be exchanged for a different size within 14 days of delivery, but isn't eligible for refund unless the piece arrives faulty.",
    faq_q5:"Something arrived damaged or wrong. What now?",
    faq_a5:"Message us with your order number and a photo within 7 days of delivery and it'll be remade or refunded — no questions asked.",
    faq_h_sizing:"Sizing",
    faq_q6:"How do the clothes fit?",
    faq_a6:"Cuts run true to size and slightly relaxed rather than fitted. If you're between two sizes, size down for a closer fit or up for a roomier one — each product page notes the fabric weight, which affects drape.",
    faq_q7:"Do you offer custom sizing?",
    faq_a7:"Not yet at scale, but for made-to-order pieces, message us before ordering and we'll see what's possible.",
    faq_h_contact:"Contact", faq_contact_intro:"For anything not covered above — orders, custom requests, wholesale, or just questions.",
    contact_email_key:"Email", contact_studio_key:"Studio", contact_studio_val:"Morocco — by appointment",
    contact_hours_key:"Hours", contact_hours_val:"Mon–Sat, 10:00–18:00",
    contact_name_label:"Name", contact_name_placeholder:"Your name",
    contact_email_label:"Email", contact_email_placeholder:"you@email.com",
    contact_message_label:"Message", contact_message_placeholder:"Order questions, custom requests, wholesale…",
    contact_submit:"Send message", contact_note:"Messages here go straight to the studio inbox.",
    contact_fill_all:"Please fill in your name, email and message.",
    contact_sending:"Sending…",
    contact_success:"Message sent — the studio will get back to you soon.",
    contact_error:"Could not send the message. Please try again, or email studio@youssefboukhmiss.com directly.",
  },
  fr: {
    nav_shop:"Boutique", nav_about:"À propos", nav_faq:"Livraison & FAQ", cart_bag:"Panier",
    footer_shipping:"Livraison & retours", footer_contact:"Contact", footer_admin:"Administration",
    footer_location:"Maroc — fabriqué sur commande", footer_note:"Tous droits réservés.",

    hero_eyebrow:"Index de l'atelier — établi, Maroc",
    hero_welcome_prefix:"Bienvenue à", hero_welcome_word:"l'atelier",
    hero_desc:"Chaque pièce est coupée, pas imprimée. Pas de saisons — juste un index continu de vêtements et d'objets, complété pièce par pièce au fur et à mesure.",
    hero_cta:"Voir l'index →",
    hero_fact_clothing_objects:"Vêtements & objets", hero_fact_from:"Dès", hero_fact_ships:"Expédié en 5 à 10 jours", hero_fact_morocco:"Maroc",

    label_card_title:"Entretien & contenu", label_contains_key:"Contient", label_contains_val:"Vêtements / objets",
    label_filler_key:"Superflu", label_filler_val:"Aucun", label_made_key:"Fabriqué en", label_made_val:"Maroc",
    label_index_key:"Index", label_care_key:"Entretien", label_care_val:"À traiter comme tout objet fait main",

    catalog_title:"L'Index", catalog_sub_loading:"— chargement des pièces…", catalog_sub_suffix:"pièces actuellement disponibles",
    tab_all:"Tout", tab_clothing:"Vêtements", tab_objects:"Objets",
    add_btn:"Ajouter", added_btn:"Ajouté",

    p_size_label:"Taille", p_add_big:"Ajouter au panier", p_meta:"Fabriqué sur commande au Maroc. Comptez 5 à 10 jours avant l'expédition.",

    chat_toggle:"Contacter l'atelier", chat_title:"Assistant de l'atelier", chat_send:"Envoyer",
    chat_input_placeholder:"Question sur la livraison, les tailles…",
    chat_greeting:"Salam ! Je suis l'assistant de l'atelier — posez-moi vos questions sur la livraison, les tailles, les retours, ou comment nous contacter.",
    chat_quick_shipping:"Délais de livraison", chat_quick_sizing:"Tailles", chat_quick_returns:"Retours", chat_quick_contact:"Contact",
    chat_fallback:"Je n'ai pas encore de réponse à ça — le plus rapide est d'écrire à studio@youssefboukhmiss.com ou d'utiliser le formulaire de contact sur la page Livraison & FAQ.",
    chat_reply_shipping:"Les vêtements sont fabriqués sur commande — comptez 5 à 10 jours ouvrés avant l'expédition. Les objets comme les mugs, totes et bonnets partent généralement sous 1 à 3 jours ouvrés. La livraison au Maroc prend 2 à 4 jours ouvrés après l'expédition.",
    chat_reply_returns:"Les objets peuvent être retournés sous 14 jours s'ils sont non utilisés et dans leur emballage d'origine. Les vêtements sur commande peuvent être échangés pour une autre taille sous 14 jours, mais ne sont remboursables qu'en cas de défaut.",
    chat_reply_sizing:"Les coupes taillent normalement, avec une coupe légèrement ample. Entre deux tailles, prenez la plus petite pour un ajustement plus près du corps, ou la plus grande pour plus d'aisance. Le sur-mesure n'est pas encore proposé à grande échelle — contactez l'atelier avant de commander une pièce sur commande.",
    chat_reply_price:"Les prix varient selon la pièce — les objets démarrent autour de 60 MAD, les vêtements à partir d'environ 260 MAD. Consultez l'index pour le prix exact de chaque pièce.",
    chat_reply_contact:"Vous pouvez joindre l'atelier à studio@youssefboukhmiss.com ou sur WhatsApp au +212 6XX-XXXXXX, du lundi au samedi de 10h à 18h. Il y a aussi un formulaire de contact sur la page Livraison & FAQ.",
    chat_reply_location:"Tout est fabriqué au Maroc. L'atelier est ouvert sur rendez-vous.",
    chat_reply_damage:"Si un article arrive endommagé ou erroné, contactez l'atelier avec votre numéro de commande et une photo sous 7 jours après réception — il sera refait ou remboursé, sans question.",
    chat_reply_hi:"Salam ! Posez-moi vos questions sur la livraison, les tailles, les retours, ou comment contacter l'atelier.",

    drawer_title:"Bon de commande", drawer_stamp:"DANS LE PANIER", drawer_empty:"— le panier est vide —",
    subtotal_label:"Sous-total", checkout_button:"Commander",
    drawer_note:"Paiement à la livraison — réglez en espèces à la réception.", remove_btn:"supprimer",
    checkout_empty:"Votre panier est vide.",
    checkout_success:"Commande reçue — paiement à la livraison. Nous vous contacterons pour confirmer avant l'expédition.",
    checkout_error:"Un problème est survenu lors de la commande. Réessayez, ou contactez directement l'atelier.",

    page_eyebrow_about:"L'atelier", page_title_about:"Un nom, un index.",
    page_sub_about:"Pourquoi il n'y a ni « collection », ni sortie saisonnière, ni logo plus grand qu'un point de couture.",
    about_h1:"Comment tout a commencé",
    about_p1:"Tout a commencé avec quelques pièces faites pour des proches — une veste pour un ami qui perdait sans cesse ses boutons, une série de mugs pour un atelier qui en avait besoin de meilleurs. Il n'y a jamais eu de plan pour bâtir une « marque ». Juste l'habitude de bien faire les choses, et des gens qui demandaient où s'en procurer aussi.",
    about_p2:"Alors plutôt qu'une boutique organisée par saisons, il y a un index. Chaque pièce fabriquée reçoit un numéro. Rien n'est retiré pour faire de la place à autre chose — si c'est dans l'index, ça reste commandable.",
    about_h2:"Pourquoi tout est signé",
    about_p3:"La signature sur la page d'accueil n'est pas un logo — c'est la marque véritable apposée sur chaque étiquette d'entretien, comme elle le serait au bas d'une lettre. Si une pièce a un défaut, cette signature est une promesse qu'elle sera réparée, pas juste un nom sur une étiquette.",
    about_h3:"Comment les pièces sont fabriquées",
    about_p4:"Les vêtements sont coupés en petites séries au Maroc, la plupart du temps sur commande, ce qui explique des délais de 5 à 10 jours plutôt qu'une livraison le lendemain. Les objets — mugs, totes, petites pièces — sont produits par une courte liste d'artisans locaux dont le travail a fait ses preuves au fil des années, pas d'un seul lavage.",
    about_h4:"Ce que « sans superflu » veut dire",
    about_p5:"Chaque pièce de l'index mérite sa place. Rien n'est ajouté juste pour compléter une grille de tailles ou étoffer une page de collection. Si une pièce cesse d'être bonne, elle sort de l'index plutôt que de rester par habitude.",

    page_eyebrow_faq:"Avant de commander", page_title_faq:"Livraison, retours & tailles.",
    page_sub_faq:"Tout ce qu'il faut savoir avant qu'une pièce ne quitte l'atelier.",
    faq_h_shipping:"Livraison",
    faq_q1:"Combien de temps avant l'expédition de ma commande ?",
    faq_a1:"Les vêtements sont fabriqués sur commande — comptez 5 à 10 jours ouvrés avant l'expédition. Les objets (mugs, totes, stickers, bonnets) partent généralement sous 1 à 3 jours ouvrés, car un petit stock est toujours prêt.",
    faq_q2:"Où livrez-vous ?",
    faq_a2:"Partout au Maroc, en 2 à 4 jours ouvrés après expédition. Les commandes internationales sont traitées au cas par cas — contactez-nous avant de commander si vous êtes hors du Maroc.",
    faq_q3:"Combien coûte la livraison ?",
    faq_a3:"Tarif fixe au Maroc. Gratuite au-delà de 800 MAD. Les tarifs internationaux dépendent de la destination et sont communiqués avant le paiement.",
    faq_h_returns:"Retours & échanges",
    faq_q4:"Puis-je retourner un article ?",
    faq_a4:"Les objets peuvent être retournés sous 14 jours s'ils sont non utilisés et dans leur emballage d'origine. Les vêtements sur commande peuvent être échangés pour une autre taille sous 14 jours après réception, mais ne sont remboursables qu'en cas de défaut à la livraison.",
    faq_q5:"Un article est arrivé endommagé ou erroné. Que faire ?",
    faq_a5:"Contactez-nous avec votre numéro de commande et une photo sous 7 jours après réception — la pièce sera refaite ou remboursée, sans question.",
    faq_h_sizing:"Tailles",
    faq_q6:"Comment taillent les vêtements ?",
    faq_a6:"Les coupes taillent normalement, avec une coupe légèrement ample plutôt que cintrée. Entre deux tailles, prenez la plus petite pour un ajustement plus près du corps, ou la plus grande pour plus d'aisance — chaque fiche produit précise le grammage du tissu, qui influence la tombée.",
    faq_q7:"Proposez-vous du sur-mesure ?",
    faq_a7:"Pas encore à grande échelle, mais pour les pièces sur commande, contactez-nous avant d'acheter et nous verrons ce qui est possible.",
    faq_h_contact:"Contact", faq_contact_intro:"Pour tout ce qui n'est pas couvert ci-dessus — commandes, demandes sur mesure, gros, ou simples questions.",
    contact_email_key:"Email", contact_studio_key:"Atelier", contact_studio_val:"Maroc — sur rendez-vous",
    contact_hours_key:"Horaires", contact_hours_val:"Lun–Sam, 10h–18h",
    contact_name_label:"Nom", contact_name_placeholder:"Votre nom",
    contact_email_label:"Email", contact_email_placeholder:"vous@email.com",
    contact_message_label:"Message", contact_message_placeholder:"Questions sur une commande, demande sur mesure, gros…",
    contact_submit:"Envoyer le message", contact_note:"Les messages ici arrivent directement à l'atelier.",
    contact_fill_all:"Merci de renseigner votre nom, votre email et votre message.",
    contact_sending:"Envoi…",
    contact_success:"Message envoyé — l'atelier vous répondra bientôt.",
    contact_error:"Impossible d'envoyer le message. Réessayez, ou écrivez directement à studio@youssefboukhmiss.com.",
  },
  ar: {
    nav_shop:"المتجر", nav_about:"من نحن", nav_faq:"الشحن والأسئلة الشائعة", cart_bag:"الحقيبة",
    footer_shipping:"الشحن والإرجاع", footer_contact:"تواصل", footer_admin:"لوحة الإدارة",
    footer_location:"المغرب — يُصنع حسب الطلب", footer_note:"جميع الحقوق محفوظة.",

    hero_eyebrow:"فهرس الأتيليه — تأسس بالمغرب",
    hero_welcome_prefix:"مرحباً بك في", hero_welcome_word:"الأتيليه",
    hero_desc:"كل قطعة مقصوصة، ماشي مطبوعة. بلا مواسم — غير فهرس مستمر ديال الملابس والأغراض، كيتزاد فيه قطعة بقطعة كيفما كيتصاوبو.",
    hero_cta:"تسوق الفهرس ←",
    hero_fact_clothing_objects:"ملابس وأغراض", hero_fact_from:"ابتداءً من", hero_fact_ships:"الشحن فظرف 5-10 أيام", hero_fact_morocco:"المغرب",

    label_card_title:"العناية والمحتوى", label_contains_key:"يحتوي على", label_contains_val:"ملابس / أغراض",
    label_filler_key:"حشو", label_filler_val:"لا يوجد", label_made_key:"صُنع في", label_made_val:"المغرب",
    label_index_key:"الفهرس", label_care_key:"العناية", label_care_val:"تعامل معها كأي شيء مصنوع يدوياً",

    catalog_title:"الفهرس", catalog_sub_loading:"— كنحملو القطع…", catalog_sub_suffix:"قطعة، متوفرة حالياً",
    tab_all:"الكل", tab_clothing:"ملابس", tab_objects:"أغراض",
    add_btn:"أضف", added_btn:"تمت الإضافة",

    p_size_label:"المقاس", p_add_big:"أضف إلى السلة", p_meta:"يُصنع حسب الطلب بالمغرب. احسب 5 إلى 10 أيام قبل الشحن.",

    chat_toggle:"اسأل الأتيليه", chat_title:"مساعد الأتيليه", chat_send:"إرسال",
    chat_input_placeholder:"اسأل عن الشحن، المقاسات…",
    chat_greeting:"سلام! أنا مساعد الأتيليه — اسألني عن الشحن، المقاسات، الإرجاع، أو كيفاش توصل لينا.",
    chat_quick_shipping:"مدة الشحن", chat_quick_sizing:"المقاسات", chat_quick_returns:"الإرجاع", chat_quick_contact:"تواصل",
    chat_fallback:"مازال ماعنديش جواب على هادشي — أسرع طريقة هي تبعث بريد إلكتروني ل studio@youssefboukhmiss.com ولا تستعمل نموذج التواصل فصفحة الشحن والأسئلة الشائعة.",
    chat_reply_shipping:"الملابس كتتصاوب حسب الطلب — احسب 5 إلى 10 أيام خدمة قبل الشحن. الأغراض بحال الكيسان والأكياس والطواقي عادة كتشحن فظرف 1 إلى 3 أيام خدمة. التوصيل داخل المغرب كياخد 2 إلى 4 أيام خدمة من بعد الشحن.",
    chat_reply_returns:"الأغراض تقدر ترجع فظرف 14 يوم إلا ماستعملاتش وفالتغليف الأصلي. الملابس المصنوعة حسب الطلب تقدر تتبدل بمقاس آخر فظرف 14 يوم، ولكن ما ترجعش فلوسها إلا إلا وصلات فيها عيب.",
    chat_reply_sizing:"القصات كتجي بالمقاس الطبيعي ومرتاحة شوية. إلا كنتي بين مقاسين، خود الصغير للي كيجي أقرب للجسم، ولا الكبير لراحة أكثر. المقاسات الخاصة ماشي متوفرة بعد على نطاق واسع — تواصل مع الأتيليه قبل ما تطلب قطعة حسب الطلب.",
    chat_reply_price:"الأسعار كتختلف حسب القطعة — الأغراض كتبدا من حوالي 60 درهم، والملابس من حوالي 260 درهم. حل الفهرس باش تشوف الثمن بالضبط لكل قطعة.",
    chat_reply_contact:"تقدر توصل للأتيليه عبر studio@youssefboukhmiss.com ولا واتساب +212 6XX-XXXXXX، من الاثنين للسبت من 10:00 حتى 18:00. كاين ايضاً نموذج تواصل فصفحة الشحن والأسئلة الشائعة.",
    chat_reply_location:"كلشي كيتصاوب بالمغرب. الأتيليه مفتوح بموعد.",
    chat_reply_damage:"إلا وصلاتك حاجة معيوبة ولا غالطة، بعث للأتيليه رقم الطلب وتصويرة فظرف 7 أيام من التوصيل — غادي تتعوض ليك ولا ترجع ليك فلوسك، بلا أي سؤال.",
    chat_reply_hi:"سلام! اسألني عن الشحن، المقاسات، الإرجاع، أو كيفاش توصل للأتيليه.",

    drawer_title:"قائمة الطلب", drawer_stamp:"في السلة", drawer_empty:"— السلة فارغة —",
    subtotal_label:"المجموع الفرعي", checkout_button:"إتمام الطلب",
    drawer_note:"الدفع عند الاستلام — تخلص نقداً عند وصول الطلب.", remove_btn:"إزالة",
    checkout_empty:"السلة ديالك فارغة.",
    checkout_success:"توصل الطلب — الدفع عند الاستلام. غادي نتواصلو معاك للتأكيد قبل الشحن.",
    checkout_error:"وقع مشكل فتسجيل الطلب. عاود جرب، ولا تواصل مباشرة مع الأتيليه.",

    page_eyebrow_about:"الأتيليه", page_title_about:"اسم واحد، فهرس واحد.",
    page_sub_about:"علاش ماكاينش \"كولكسيون\"، ولا إصدار موسمي، ولا لوغو كبير من الغرزة.",
    about_h1:"كيفاش بدا هاد المشروع",
    about_p1:"بدا هاد المشروع بشوية ديال القطع لي تصاوبو لناس كنعرفهم — جاكيط لصاحبي لي كايضيع الزرار ديال جاكيطتو القديمة، طقم كيسان لأتيليه محتاج لواحد أحسن. ماكانش هناك أي نية باش نبنيو \"ماركة\". غير عادة نديرو الحوايج بالطريقة الصحيحة، والناس كيسولو فين يقدرو يشريو واحد.",
    about_p2:"فبدل حانوت مبني على المواسم، كاين فهرس. كل قطعة كتتصاوب كتاخد رقم. حتى قطعة ماكتنحاش باش نديرو بلاصة لقطعة جديدة — إلا كانت فالفهرس، مازال ممكن تطلبها.",
    about_h2:"علاش كلشي موقّع",
    about_p3:"التوقيع فالصفحة الرئيسية ماشي لوغو — هو العلامة الحقيقية لي كتتحط فكل تيكيت ديال العناية، بحال ما غادي تتحط فبراءة. إلا كان شي مشكل فقطعة، هاد التوقيع هو وعد بأنها غادي تتصلح، ماشي غير سمية فوق تيكيت.",
    about_h3:"كيفاش كتتصاوب القطع",
    about_p4:"الملابس كتتقص فدفعات صغيرة بالمغرب، الأغلبية حسب الطلب، وهادشي هو السبب لي خلال التسليم كتكون 5 إلى 10 أيام بدل نهار للنهار الآخر. الأغراض — الكيسان، الأكياس، الحوايج الصغيرة — كتتصاوب مع لائحة قصيرة ديال الصنايعية المحليين لي الخدمة ديالهم بانت فوقتها، ماشي غير غسلة وحدة.",
    about_h4:"أشنو كيعني \"بلا حشو\"",
    about_p5:"كل قطعة فالفهرس مستحقة لبلاصتها. حتى حاجة ماكتزاد غير باش تكمل شارت ديال المقاسات ولا تزيد فصفحة الكولكسيون. إلا قطعة ما بقاتش مزيانة، كتخرج من الفهرس بدل ما تبقى معلقة بالعادة.",

    page_eyebrow_faq:"قبل ما تطلب", page_title_faq:"الشحن، الإرجاع والمقاسات.",
    page_sub_faq:"كلشي خاصك تعرفه قبل ما القطعة تخرج من الأتيليه.",
    faq_h_shipping:"الشحن والتوصيل",
    faq_q1:"شحال من وقت باش يتشحن طلبي؟",
    faq_a1:"الملابس كتتصاوب حسب الطلب — احسب 5 إلى 10 أيام خدمة قبل الشحن. الأغراض (الكيسان، الأكياس، الملصقات، الطواقي) عادة كتشحن فظرف 1 إلى 3 أيام خدمة لأنها كتكون فستوك جاهز صغير.",
    faq_q2:"فين كتوصلو؟",
    faq_a2:"فكل المغرب فظرف 2 إلى 4 أيام خدمة من بعد الشحن. الطلبات الدولية كتتعامل معاها حالة بحالة — تواصل معانا قبل الطلب إلا كنتي برا المغرب.",
    faq_q3:"شحال تكلف الشحنة؟",
    faq_a3:"سعر ثابت داخل المغرب. مجانية فوق 800 درهم. الأسعار الدولية كتتوقف على الوجهة وكتتعطى قبل الأداء.",
    faq_h_returns:"الإرجاع والتبديل",
    faq_q4:"نقدر نرجع شي حاجة؟",
    faq_a4:"الأغراض تقدر ترجع فظرف 14 يوم إلا ماستعملاتش وفالتغليف الأصلي. الملابس المصنوعة حسب الطلب تقدر تتبدل بمقاس آخر فظرف 14 يوم من التوصيل، ولكن ما ترجعش فلوسها إلا إلا وصلات فيها عيب.",
    faq_q5:"وصلاتني حاجة معيوبة ولا غالطة. أشنو ندير؟",
    faq_a5:"بعث لينا رقم الطلب وتصويرة فظرف 7 أيام من التوصيل وغادي نعوضوها ليك ولا نرجعو ليك الفلوس — بلا أي سؤال.",
    faq_h_sizing:"المقاسات",
    faq_q6:"كيفاش كيجيو الحوايج؟",
    faq_a6:"القصات كتجي بالمقاس الطبيعي ومرتاحة شوية بدل ضيقة. إلا كنتي بين مقاسين، خود الصغير للي كيجي أقرب للجسم، ولا الكبير لراحة أكثر — كل صفحة منتوج فيها وزن القماش لي كيأثر على الطريقة لي كيهبط بيها.",
    faq_q7:"كتديرو مقاسات خاصة؟",
    faq_a7:"ماشي بعد على نطاق واسع، ولكن بالنسبة للقطع المصنوعة حسب الطلب، تواصل معانا قبل ما تطلب وغادي نشوفو أشنو ممكن.",
    faq_h_contact:"تواصل", faq_contact_intro:"لكل شي ماشي مذكور فوق — الطلبات، الطلبات الخاصة، الجملة، ولا غير أسئلة.",
    contact_email_key:"البريد الإلكتروني", contact_studio_key:"الأتيليه", contact_studio_val:"المغرب — بموعد",
    contact_hours_key:"أوقات العمل", contact_hours_val:"الاثنين-السبت، 10:00-18:00",
    contact_name_label:"الاسم", contact_name_placeholder:"اسمك",
    contact_email_label:"البريد الإلكتروني", contact_email_placeholder:"you@email.com",
    contact_message_label:"الرسالة", contact_message_placeholder:"أسئلة على الطلب، طلبات خاصة، الجملة…",
    contact_submit:"إرسال الرسالة", contact_note:"الرسائل هنا كتوصل مباشرة لصندوق الأتيليه.",
    contact_fill_all:"عافاك عمر الاسم والبريد الإلكتروني والرسالة.",
    contact_sending:"كيتصيفط…",
    contact_success:"تصيفطات الرسالة — الأتيليه غادي يجاوبك قريباً.",
    contact_error:"ما قدرناش نصيفطو الرسالة. عاود جرب، ولا بعث بريد إلكتروني مباشرة ل studio@youssefboukhmiss.com.",
  },
};

function getLang(){
  return localStorage.getItem(LANG_KEY) || "en";
}

export function t(key){
  const lang = getLang();
  return (dict[lang] && dict[lang][key]) || dict.en[key] || key;
}

function applyTranslations(lang){
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
  document.body.classList.toggle('lang-rtl', RTL_LANGS.includes(lang));
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

window.setLang = function(lang){
  localStorage.setItem(LANG_KEY, lang);
  applyTranslations(lang);
  window.dispatchEvent(new CustomEvent('yb:langchange', { detail: { lang } }));
};

export function initI18n(){
  applyTranslations(getLang());
}
