const db = require("./database");

const posts = [
{
slug:"ajwa-dates-al-madinah",
title_en:"Ajwa Dates from Al Madinah: What Makes Them Special?",
title_ar:"تمور العجوة من المدينة المنورة: ما الذي يميزها؟",
title_ms:"Kurma Ajwa dari Al Madinah: Apakah Keistimewaannya?",
excerpt_en:"Discover the character, heritage, texture and premium appeal of Ajwa dates from Al Madinah.",
excerpt_ar:"اكتشف خصائص تمور العجوة وتراثها وقوامها ومكانتها كأحد أبرز أصناف التمور السعودية الفاخرة.",
excerpt_ms:"Kenali ciri, warisan, tekstur dan daya tarikan premium kurma Ajwa dari Al Madinah.",
content_en:`
<h2>A Distinguished Saudi Date Variety</h2>
<p>Ajwa dates are one of the most recognised varieties associated with Al Madinah Al Munawwarah. Their deep colour, distinctive texture and naturally rich flavour have made them an important part of Saudi date culture.</p>
<h2>Origin and Heritage</h2>
<p>Al Madinah has a long-standing relationship with date cultivation. For customers discovering Saudi dates for the first time, the origin of Ajwa adds an important part of the product story.</p>
<h2>What to Look For</h2>
<p>When selecting premium Ajwa, consider appearance, texture, freshness, packaging and consistency. Careful selection helps preserve the quality customers expect from a premium product.</p>
<h2>How to Enjoy Ajwa</h2>
<p>Ajwa can be enjoyed as an everyday snack, served with Arabic coffee, presented to guests, or included in premium gift selections.</p>
<h2>MASSAR DATES</h2>
<p>At MASSAR DATES, we focus on bringing carefully selected Saudi dates closer to customers in Malaysia and international markets while respecting their authentic origin and heritage.</p>
`,
content_ar:`
<h2>صنف سعودي مميز</h2>
<p>تُعد تمور العجوة من أشهر الأصناف المرتبطة بالمدينة المنورة. وتتميز بلونها الداكن وقوامها المميز ومذاقها الطبيعي الغني، كما تمثل جزءًا مهمًا من ثقافة التمور السعودية.</p>
<h2>الأصل والتراث</h2>
<p>ترتبط المدينة المنورة بتاريخ طويل مع زراعة النخيل وإنتاج التمور. وعند اكتشاف التمور السعودية، فإن معرفة أصل العجوة تضيف قيمة مهمة إلى تجربة المنتج.</p>
<h2>ما الذي نبحث عنه؟</h2>
<p>عند اختيار العجوة الفاخرة، من المهم الاهتمام بالمظهر والقوام والنضارة والتغليف والثبات في الجودة.</p>
<h2>طرق الاستمتاع بالعجوة</h2>
<p>يمكن الاستمتاع بالعجوة كوجبة خفيفة يومية، أو تقديمها مع القهوة العربية، أو استخدامها في الضيافة والهدايا الفاخرة.</p>
<h2>MASSAR DATES</h2>
<p>في MASSAR DATES نركز على تقديم تمور سعودية مختارة بعناية للعملاء في ماليزيا والأسواق الدولية، مع المحافظة على أصالتها وتراثها.</p>
`,
content_ms:`
<h2>Kurma Saudi yang Istimewa</h2>
<p>Kurma Ajwa merupakan antara jenis kurma paling terkenal yang dikaitkan dengan Al Madinah. Warnanya yang gelap, tekstur tersendiri dan rasa semula jadi yang kaya menjadikannya sebahagian penting daripada budaya kurma Saudi.</p>
<h2>Asal dan Warisan</h2>
<p>Al Madinah mempunyai hubungan yang panjang dengan penanaman pokok kurma. Mengetahui asal Ajwa memberikan nilai tambahan kepada pengalaman menikmati produk tersebut.</p>
<h2>Apa yang Perlu Diperhatikan?</h2>
<p>Pilih Ajwa premium dengan melihat rupa, tekstur, kesegaran, pembungkusan dan konsistensi kualiti.</p>
<h2>Cara Menikmati Ajwa</h2>
<p>Ajwa sesuai dinikmati sebagai snek harian, bersama kopi Arab, untuk hidangan tetamu atau sebagai sebahagian daripada hadiah premium.</p>
<h2>MASSAR DATES</h2>
<p>Di MASSAR DATES, kami memberi tumpuan kepada kurma Saudi yang dipilih dengan teliti untuk pelanggan di Malaysia dan pasaran antarabangsa.</p>
`,
category:"types-of-dates", featured:1, sort_order:1
},

{
slug:"guide-choosing-saudi-dates",
title_en:"Guide to Choosing the Right Saudi Dates",
title_ar:"دليل اختيار التمور السعودية المناسبة",
title_ms:"Panduan Memilih Kurma Saudi yang Tepat",
excerpt_en:"A practical guide to choosing Saudi dates based on variety, texture, appearance, occasion and preference.",
excerpt_ar:"دليل عملي لاختيار التمور السعودية بحسب الصنف والقوام والمظهر والمناسبة والذوق.",
excerpt_ms:"Panduan praktikal memilih kurma Saudi berdasarkan jenis, tekstur, rupa, kegunaan dan cita rasa.",
content_en:`
<h2>Start With the Variety</h2>
<p>Every date variety has its own character. Ajwa, Sukkari, Safawi, Medjool and other varieties differ naturally in texture, colour, sweetness and size.</p>
<h2>Consider Texture</h2>
<p>Some customers prefer soft and tender dates, while others enjoy firmer varieties. Texture is one of the easiest ways to identify the type of date that suits you.</p>
<h2>Look at Appearance</h2>
<p>Clean presentation, consistent sizing and attractive appearance are important when selecting dates for home use, hospitality or gifting.</p>
<h2>Choose According to the Occasion</h2>
<p>Everyday snacking, Arabic coffee, family gatherings, corporate gifts and retail presentation may require different varieties and pack sizes.</p>
<h2>Check Origin and Packaging</h2>
<p>Origin and packaging provide useful information about the product and help protect quality during storage and transport.</p>
`,
content_ar:`
<h2>ابدأ باختيار الصنف</h2>
<p>لكل صنف من أصناف التمور شخصيته الخاصة. تختلف العجوة والسكري والصفاوي والمجهول وغيرها في القوام واللون والحلاوة والحجم.</p>
<h2>انتبه إلى القوام</h2>
<p>يفضل بعض العملاء التمور الطرية، بينما يفضل آخرون الأصناف الأكثر تماسكًا. ويُعد القوام من أهم الطرق لمعرفة الصنف المناسب لك.</p>
<h2>لاحظ المظهر</h2>
<p>النظافة والتناسق وجمال المظهر عناصر مهمة عند اختيار التمور للاستخدام المنزلي أو الضيافة أو الهدايا.</p>
<h2>اختر حسب المناسبة</h2>
<p>التمور للاستهلاك اليومي أو القهوة العربية أو التجمعات العائلية أو هدايا الشركات أو البيع بالتجزئة قد تختلف بحسب المناسبة.</p>
<h2>تحقق من المنشأ والتغليف</h2>
<p>يوفر المنشأ والتغليف معلومات مهمة عن المنتج ويساعدان على المحافظة على الجودة أثناء التخزين والنقل.</p>
`,
content_ms:`
<h2>Mulakan Dengan Jenis Kurma</h2>
<p>Setiap jenis kurma mempunyai ciri tersendiri. Ajwa, Sukkari, Safawi, Medjool dan jenis lain berbeza dari segi tekstur, warna, kemanisan dan saiz.</p>
<h2>Perhatikan Tekstur</h2>
<p>Ada pelanggan yang suka kurma lembut, manakala yang lain lebih gemar tekstur yang sedikit lebih pejal.</p>
<h2>Lihat Rupanya</h2>
<p>Rupa yang bersih, saiz yang konsisten dan persembahan yang menarik penting untuk kegunaan rumah, hospitaliti dan hadiah.</p>
<h2>Pilih Mengikut Kegunaan</h2>
<p>Kurma untuk snek harian, kopi Arab, majlis keluarga, hadiah korporat dan jualan runcit mungkin memerlukan pilihan yang berbeza.</p>
<h2>Semak Asal dan Pembungkusan</h2>
<p>Asal produk dan pembungkusan memberikan maklumat penting serta membantu melindungi kualiti semasa penyimpanan dan pengangkutan.</p>
`,
category:"dates-guide", featured:1, sort_order:2
},

{
slug:"how-to-keep-dates-fresh",
title_en:"How to Keep Dates Fresh",
title_ar:"كيف تحافظ على نضارة التمور؟",
title_ms:"Cara Mengekalkan Kesegaran Kurma",
excerpt_en:"Learn practical storage habits that help preserve the texture, taste and quality of dates.",
excerpt_ar:"تعرف على أفضل العادات العملية لحفظ قوام التمور ومذاقها وجودتها.",
excerpt_ms:"Ketahui amalan penyimpanan yang membantu mengekalkan tekstur, rasa dan kualiti kurma.",
content_en:`
<h2>Keep the Package Sealed</h2>
<p>After opening dates, close the package tightly or transfer them to a clean airtight container.</p>
<h2>Protect Them From Heat and Humidity</h2>
<p>Excessive heat and humidity can affect texture and quality. Store dates in a cool and dry place unless the product instructions recommend refrigeration.</p>
<h2>Use Clean Storage Containers</h2>
<p>A clean container helps keep the product protected from external moisture and contaminants.</p>
<h2>Follow the Product Label</h2>
<p>Commercially packaged dates should always be stored according to the instructions provided on the packaging.</p>
<h2>A Note About Natural Changes</h2>
<p>Some dates may naturally develop changes in texture or visible sugar crystallisation over time. This can be part of the natural characteristics of dates.</p>
`,
content_ar:`
<h2>أغلق العبوة بإحكام</h2>
<p>بعد فتح التمور، احرص على إغلاق العبوة جيدًا أو نقلها إلى حاوية نظيفة ومحكمة الإغلاق.</p>
<h2>احمها من الحرارة والرطوبة</h2>
<p>قد تؤثر الحرارة العالية والرطوبة على القوام والجودة. احفظ التمور في مكان بارد وجاف ما لم تنص تعليمات المنتج على التبريد.</p>
<h2>استخدم حاوية نظيفة</h2>
<p>تساعد الحاوية النظيفة على حماية المنتج من الرطوبة والعوامل الخارجية.</p>
<h2>اتبع تعليمات العبوة</h2>
<p>يجب دائمًا اتباع تعليمات التخزين المكتوبة على العبوة التجارية.</p>
<h2>تغيرات طبيعية</h2>
<p>قد تطرأ بعض التغيرات الطبيعية على قوام التمور أو قد تظهر بلورات السكر مع مرور الوقت، وهذا قد يكون من الخصائص الطبيعية للتمور.</p>
`,
content_ms:`
<h2>Pastikan Bungkusan Ditutup</h2>
<p>Selepas membuka kurma, tutup bungkusan dengan rapat atau pindahkan ke dalam bekas kedap udara yang bersih.</p>
<h2>Lindungi Daripada Haba dan Kelembapan</h2>
<p>Haba dan kelembapan yang tinggi boleh mempengaruhi tekstur dan kualiti. Simpan di tempat sejuk dan kering melainkan arahan produk menyatakan sebaliknya.</p>
<h2>Gunakan Bekas Bersih</h2>
<p>Bekas yang bersih membantu melindungi produk daripada kelembapan dan faktor luaran.</p>
<h2>Ikuti Arahan Produk</h2>
<p>Patuhi arahan penyimpanan yang diberikan pada label produk.</p>
<h2>Perubahan Semula Jadi</h2>
<p>Sesetengah kurma mungkin mengalami perubahan tekstur atau pembentukan kristal gula semula jadi dari masa ke masa.</p>
`,
category:"dates-guide", featured:0, sort_order:3
},

{
slug:"ajwa-vs-safawi-vs-sukkari-vs-medjool",
title_en:"Ajwa vs Safawi vs Sukkari vs Medjool",
title_ar:"العجوة أم الصفاوي أم السكري أم المجهول؟",
title_ms:"Ajwa vs Safawi vs Sukkari vs Medjool",
excerpt_en:"Compare four popular varieties and discover which style of date may suit different preferences.",
excerpt_ar:"مقارنة بين أربعة أصناف شهيرة ومعرفة ما يميز كل صنف بحسب الذوق والقوام والمناسبة.",
excerpt_ms:"Bandingkan empat jenis kurma popular dan kenali ciri setiap satunya mengikut cita rasa dan kegunaan.",
content_en:`
<h2>Ajwa</h2>
<p>Dark in appearance with a distinctive traditional character, Ajwa is strongly associated with Al Madinah.</p>
<h2>Safawi</h2>
<p>Safawi is known for its dark colour and soft, rich character, making it a popular everyday premium choice.</p>
<h2>Sukkari</h2>
<p>Sukkari is known for its naturally sweet flavour and attractive golden appearance.</p>
<h2>Medjool</h2>
<p>Medjool is recognised for its large size, soft texture and luxurious presentation.</p>
<h2>Which One Should You Choose?</h2>
<p>The answer depends on your preferred sweetness, texture, size, occasion and presentation. Exploring several varieties is often the best way to discover your favourite.</p>
`,
content_ar:`
<h2>العجوة</h2>
<p>تتميز بلونها الداكن وطابعها التقليدي المميز وترتبط بشكل خاص بالمدينة المنورة.</p>
<h2>الصفاوي</h2>
<p>يشتهر بلونه الداكن وقوامه الناعم ومذاقه الغني، وهو خيار مميز للاستهلاك اليومي.</p>
<h2>السكري</h2>
<p>يتميز بحلاوته الطبيعية ومظهره الذهبي الجذاب.</p>
<h2>المجهول</h2>
<p>يشتهر بحجمه الكبير وقوامه الطري ومظهره الفاخر.</p>
<h2>أيها تختار؟</h2>
<p>يعتمد الاختيار على مستوى الحلاوة والقوام والحجم والمناسبة وطريقة التقديم. وتجربة عدة أصناف تساعدك على اكتشاف المفضل لديك.</p>
`,
content_ms:`
<h2>Ajwa</h2>
<p>Berwarna gelap dengan ciri tradisional yang tersendiri dan sangat dikaitkan dengan Al Madinah.</p>
<h2>Safawi</h2>
<p>Dikenali dengan warna gelap, tekstur lembut dan rasa yang kaya.</p>
<h2>Sukkari</h2>
<p>Terkenal dengan rasa manis semula jadi dan penampilan keemasan.</p>
<h2>Medjool</h2>
<p>Dikenali dengan saiz besar, tekstur lembut dan persembahan yang mewah.</p>
<h2>Mana Yang Sesuai?</h2>
<p>Pilihan bergantung pada tahap kemanisan, tekstur, saiz, majlis dan cara persembahan yang anda sukai.</p>
`,
category:"types-of-dates", featured:0, sort_order:4
},

{
slug:"from-saudi-farms-to-your-home",
title_en:"From Saudi Farms to Your Home",
title_ar:"من مزارع السعودية إلى منزلك",
title_ms:"Dari Ladang Saudi ke Rumah Anda",
excerpt_en:"Discover the journey of Saudi dates from cultivation and harvesting to careful selection and professional packaging.",
excerpt_ar:"اكتشف رحلة التمور السعودية من الزراعة والحصاد إلى الاختيار الدقيق والتغليف الاحترافي.",
excerpt_ms:"Temui perjalanan kurma Saudi daripada penanaman dan penuaian hingga pemilihan serta pembungkusan profesional.",
content_en:`
<h2>The Journey Begins at the Farm</h2>
<p>Premium dates begin with cultivation, pollination, fruit development and careful agricultural management.</p>
<h2>Harvesting Matters</h2>
<p>Harvest timing and careful handling influence the final condition, texture and presentation of the fruit.</p>
<h2>Selection and Handling</h2>
<p>Sorting and quality selection help create consistency before dates are packaged and distributed.</p>
<h2>From Saudi Arabia to Malaysia</h2>
<p>MASSAR DATES aims to connect trusted Saudi origins with customers in Malaysia and other international markets through professional sourcing and presentation.</p>
`,
content_ar:`
<h2>تبدأ الرحلة من المزرعة</h2>
<p>تبدأ التمور الفاخرة من الزراعة والتلقيح ونمو الثمار والرعاية الزراعية الدقيقة.</p>
<h2>أهمية الحصاد</h2>
<p>يؤثر توقيت الحصاد وطريقة التعامل مع الثمار في حالتها النهائية وقوامها ومظهرها.</p>
<h2>الفرز والاختيار</h2>
<p>يساعد الفرز واختيار الجودة على تحقيق مستوى أكثر ثباتًا قبل التغليف والتوزيع.</p>
<h2>من السعودية إلى ماليزيا</h2>
<p>تهدف MASSAR DATES إلى ربط المصادر السعودية الموثوقة بالعملاء في ماليزيا والأسواق الدولية من خلال التوريد والتقديم الاحترافي.</p>
`,
content_ms:`
<h2>Perjalanan Bermula di Ladang</h2>
<p>Kurma premium bermula daripada penanaman, pendebungaan, perkembangan buah dan pengurusan pertanian yang teliti.</p>
<h2>Kepentingan Penuaian</h2>
<p>Masa penuaian dan cara pengendalian mempengaruhi keadaan, tekstur dan rupa buah.</p>
<h2>Pemilihan dan Pengendalian</h2>
<p>Proses pengasingan dan pemilihan kualiti membantu memastikan konsistensi sebelum pembungkusan.</p>
<h2>Dari Saudi ke Malaysia</h2>
<p>MASSAR DATES berusaha menghubungkan sumber Saudi yang dipercayai dengan pelanggan di Malaysia dan pasaran antarabangsa.</p>
`,
category:"saudi-farms", featured:1, sort_order:5
},

{
slug:"al-madinah-date-heritage",
title_en:"Al Madinah and the Heritage of Saudi Dates",
title_ar:"المدينة المنورة وتراث التمور السعودية",
title_ms:"Al Madinah dan Warisan Kurma Saudi",
excerpt_en:"Explore the connection between Al Madinah, date cultivation and the cultural heritage of Saudi Arabia.",
excerpt_ar:"تعرف على العلاقة بين المدينة المنورة وزراعة التمور والإرث الثقافي في المملكة العربية السعودية.",
excerpt_ms:"Terokai hubungan antara Al Madinah, penanaman kurma dan warisan budaya Arab Saudi.",
content_en:`
<h2>A Region Rich in Date Heritage</h2>
<p>Al Madinah has a strong association with date cultivation and traditional Saudi hospitality.</p>
<h2>The Story Behind the Product</h2>
<p>Understanding regional origin helps customers appreciate the diversity of Saudi dates and the traditions connected with them.</p>
<h2>Preserving the Heritage</h2>
<p>Presenting authentic Saudi varieties with clear origin information helps carry the story of the date palm from one market to another.</p>
`,
content_ar:`
<h2>منطقة غنية بتراث التمور</h2>
<p>ترتبط المدينة المنورة ارتباطًا وثيقًا بزراعة التمور والضيافة السعودية التقليدية.</p>
<h2>القصة خلف المنتج</h2>
<p>يساعد فهم المنشأ الإقليمي العملاء على تقدير تنوع التمور السعودية والتقاليد المرتبطة بها.</p>
<h2>الحفاظ على التراث</h2>
<p>يساهم تقديم الأصناف السعودية الأصيلة مع معلومات واضحة عن منشئها في نقل قصة النخلة والتمر إلى أسواق جديدة.</p>
`,
content_ms:`
<h2>Wilayah yang Kaya dengan Warisan Kurma</h2>
<p>Al Madinah mempunyai hubungan yang kuat dengan penanaman kurma dan budaya hospitaliti Saudi.</p>
<h2>Kisah di Sebalik Produk</h2>
<p>Mengetahui asal wilayah membantu pelanggan menghargai kepelbagaian kurma Saudi dan tradisi yang berkaitan dengannya.</p>
<h2>Memelihara Warisan</h2>
<p>Menyampaikan jenis kurma Saudi asli bersama maklumat asal yang jelas membantu membawa kisah pokok kurma ke pasaran baharu.</p>
`,
category:"saudi-farms", featured:0, sort_order:6
},

{
slug:"dates-and-natural-nutrition",
title_en:"Dates as a Naturally Sweet Food",
title_ar:"التمور كغذاء طبيعي حلو المذاق",
title_ms:"Kurma sebagai Makanan Manis Semula Jadi",
excerpt_en:"Learn how dates can fit into a varied diet and why they are valued as a naturally sweet food.",
excerpt_ar:"تعرف على كيفية إدخال التمور ضمن نظام غذائي متنوع ولماذا تحظى بقيمة كغذاء حلو طبيعي.",
excerpt_ms:"Ketahui bagaimana kurma boleh dinikmati sebagai sebahagian daripada diet pelbagai dan mengapa ia dihargai sebagai makanan manis semula jadi.",
content_en:`
<h2>Naturally Sweet</h2>
<p>Dates have a naturally sweet taste and contain carbohydrates and dietary fibre.</p>
<h2>A Convenient Snack</h2>
<p>Dates are easy to serve at home, at work or during hospitality occasions.</p>
<h2>Pairing Dates With Other Foods</h2>
<p>Dates can be enjoyed with nuts, oats, dairy products, fruit and other foods as part of a varied eating pattern.</p>
<h2>Enjoy With Balance</h2>
<p>Dates are best enjoyed as part of an overall balanced diet and appropriate portion sizes.</p>
`,
content_ar:`
<h2>حلاوة طبيعية</h2>
<p>تتميز التمور بحلاوتها الطبيعية وتحتوي على الكربوهيدرات والألياف الغذائية.</p>
<h2>وجبة خفيفة سهلة</h2>
<p>يمكن تقديم التمور بسهولة في المنزل أو العمل أو مناسبات الضيافة.</p>
<h2>دمج التمور مع أطعمة أخرى</h2>
<p>يمكن تناول التمور مع المكسرات والشوفان ومنتجات الألبان والفواكه ضمن نظام غذائي متنوع.</p>
<h2>الاستمتاع بتوازن</h2>
<p>يفضل الاستمتاع بالتمور ضمن نظام غذائي متوازن ومع مراعاة الكميات المناسبة.</p>
`,
content_ms:`
<h2>Manis Secara Semula Jadi</h2>
<p>Kurma mempunyai rasa manis semula jadi dan membekalkan karbohidrat serta serat makanan.</p>
<h2>Snek yang Mudah</h2>
<p>Kurma mudah dihidangkan di rumah, tempat kerja atau ketika menerima tetamu.</p>
<h2>Gabungkan Dengan Makanan Lain</h2>
<p>Kurma boleh dinikmati bersama kekacang, oat, produk tenusu dan buah-buahan.</p>
<h2>Nikmati Secara Seimbang</h2>
<p>Nikmati kurma sebagai sebahagian daripada diet seimbang dan dengan saiz hidangan yang sesuai.</p>
`,
category:"nutrition", featured:0, sort_order:7
},

{
slug:"arabic-coffee-and-dates",
title_en:"Arabic Coffee and Premium Saudi Dates",
title_ar:"القهوة العربية والتمور السعودية الفاخرة",
title_ms:"Kopi Arab dan Kurma Saudi Premium",
excerpt_en:"Discover one of the most iconic Saudi hospitality pairings: Arabic coffee served with premium dates.",
excerpt_ar:"اكتشف واحدة من أشهر صور الضيافة السعودية: القهوة العربية مع التمور الفاخرة.",
excerpt_ms:"Temui gandingan hospitaliti Saudi yang ikonik: kopi Arab bersama kurma premium.",
content_en:`
<h2>A Classic Hospitality Pairing</h2>
<p>Arabic coffee and dates have a special place in Saudi hospitality. Together they create a welcoming and elegant experience for guests.</p>
<h2>Presentation Matters</h2>
<p>Choose a beautiful serving tray and arrange premium dates neatly for a polished presentation.</p>
<h2>Try More Than One Variety</h2>
<p>Serving different varieties allows guests to discover differences in sweetness, texture, size and colour.</p>
`,
content_ar:`
<h2>ثنائية أصيلة في الضيافة</h2>
<p>تحتل القهوة العربية والتمور مكانة خاصة في الضيافة السعودية، وتمنحان الضيف تجربة ترحيبية أنيقة وأصيلة.</p>
<h2>أهمية التقديم</h2>
<p>اختر طبق تقديم أنيقًا ورتب التمور الفاخرة بطريقة جميلة للحصول على مظهر احترافي.</p>
<h2>جرّب أكثر من صنف</h2>
<p>يتيح تقديم عدة أصناف للضيوف اكتشاف الفروق في الحلاوة والقوام والحجم واللون.</p>
`,
content_ms:`
<h2>Gandingan Hospitaliti Klasik</h2>
<p>Kopi Arab dan kurma mempunyai tempat istimewa dalam budaya hospitaliti Saudi dan memberikan pengalaman yang mesra kepada tetamu.</p>
<h2>Persembahan Penting</h2>
<p>Gunakan dulang yang cantik dan susun kurma premium dengan kemas.</p>
<h2>Cuba Pelbagai Jenis</h2>
<p>Menghidangkan beberapa jenis kurma membolehkan tetamu menikmati perbezaan rasa, tekstur, saiz dan warna.</p>
`,
category:"recipes", featured:1, sort_order:8
},

{
slug:"date-and-nut-energy-bites",
title_en:"Date & Nut Energy Bites",
title_ar:"كرات التمر والمكسرات",
title_ms:"Bebola Kurma dan Kekacang",
excerpt_en:"A simple homemade recipe combining the natural sweetness of dates with nuts and oats.",
excerpt_ar:"وصفة منزلية بسيطة تجمع بين حلاوة التمور الطبيعية والمكسرات والشوفان.",
excerpt_ms:"Resipi mudah yang menggabungkan kemanisan semula jadi kurma dengan kekacang dan oat.",
content_en:`
<h2>Ingredients</h2>
<ul><li>1 cup pitted dates</li><li>1 cup mixed nuts</li><li>2 tablespoons oats</li><li>1 tablespoon sesame seeds</li></ul>
<h2>Method</h2>
<p>Blend the dates and nuts until the mixture begins to stick together. Add the oats and sesame seeds, shape into small balls and chill before serving.</p>
<h2>Serving Idea</h2>
<p>Serve with tea or coffee, or pack a few pieces as a convenient snack.</p>
`,
content_ar:`
<h2>المكونات</h2>
<ul><li>كوب من التمور منزوعة النوى</li><li>كوب من المكسرات المشكلة</li><li>ملعقتان من الشوفان</li><li>ملعقة من بذور السمسم</li></ul>
<h2>الطريقة</h2>
<p>اطحن التمور والمكسرات حتى يبدأ الخليط بالتماسك، ثم أضف الشوفان والسمسم وشكل الخليط إلى كرات صغيرة وضعها في الثلاجة قبل التقديم.</p>
<h2>طريقة التقديم</h2>
<p>يمكن تقديمها مع الشاي أو القهوة أو تناولها كوجبة خفيفة.</p>
`,
content_ms:`
<h2>Bahan-bahan</h2>
<ul><li>1 cawan kurma tanpa biji</li><li>1 cawan kekacang campuran</li><li>2 sudu besar oat</li><li>1 sudu besar biji bijan</li></ul>
<h2>Cara Penyediaan</h2>
<p>Kisar kurma dan kekacang sehingga adunan mula melekat. Masukkan oat dan bijan, bentukkan bebola kecil dan sejukkan sebelum dihidangkan.</p>
<h2>Cadangan Hidangan</h2>
<p>Hidangkan bersama teh atau kopi atau nikmati sebagai snek.</p>
`,
category:"recipes", featured:0, sort_order:9
},

{
slug:"why-premium-date-origin-matters",
title_en:"Why Date Origin Matters",
title_ar:"لماذا يهم منشأ التمور؟",
title_ms:"Mengapa Asal Kurma Penting?",
excerpt_en:"Understand why origin, variety and regional identity add value to the date buying experience.",
excerpt_ar:"تعرف على أهمية المنشأ والصنف والهوية الزراعية للتمور عند اختيار المنتج.",
excerpt_ms:"Fahami mengapa asal, jenis dan identiti wilayah memberi nilai kepada pengalaman memilih kurma.",
content_en:`
<h2>Origin Tells a Story</h2>
<p>The growing region helps explain the agricultural background and heritage behind a date variety.</p>
<h2>Different Regions, Different Characteristics</h2>
<p>Dates from different regions and varieties can naturally differ in size, texture, colour and flavour.</p>
<h2>More Transparency for Customers</h2>
<p>Clear origin information helps customers understand what they are buying and appreciate product authenticity.</p>
`,
content_ar:`
<h2>المنشأ يحكي قصة</h2>
<p>يساعد المنشأ الزراعي على فهم الخلفية والتراث المرتبطين بالصنف.</p>
<h2>مناطق مختلفة وخصائص مختلفة</h2>
<p>قد تختلف التمور بحسب المنطقة والصنف في الحجم والقوام واللون والمذاق.</p>
<h2>معلومات أوضح للعملاء</h2>
<p>يساعد توضيح المنشأ العميل على فهم المنتج وتقدير أصالته.</p>
`,
content_ms:`
<h2>Asal Menceritakan Sebuah Kisah</h2>
<p>Asal wilayah membantu menjelaskan latar pertanian dan warisan sesuatu jenis kurma.</p>
<h2>Wilayah Berbeza, Ciri Berbeza</h2>
<p>Kurma daripada wilayah dan jenis yang berbeza boleh mempunyai saiz, tekstur, warna dan rasa yang berbeza.</p>
<h2>Maklumat Lebih Jelas</h2>
<p>Maklumat asal yang jelas membantu pelanggan memahami produk dan menghargai keasliannya.</p>
`,
category:"news", featured:0, sort_order:10
},

{
slug:"massar-dates-quality-commitment",
title_en:"MASSAR DATES: Our Commitment to Quality",
title_ar:"MASSAR DATES: التزامنا بالجودة",
title_ms:"MASSAR DATES: Komitmen Kami Terhadap Kualiti",
excerpt_en:"Learn how MASSAR DATES approaches product selection, presentation and customer service.",
excerpt_ar:"تعرف على منهج MASSAR DATES في اختيار المنتجات والتقديم وخدمة العملاء.",
excerpt_ms:"Kenali pendekatan MASSAR DATES terhadap pemilihan produk, persembahan dan khidmat pelanggan.",
content_en:`
<h2>Selection Comes First</h2>
<p>We focus on variety, origin, appearance, texture, freshness and overall product consistency.</p>
<h2>Professional Presentation</h2>
<p>Premium products deserve clean, elegant and professional presentation that supports the customer experience.</p>
<h2>Serving Individuals and Businesses</h2>
<p>MASSAR DATES aims to support individual customers as well as retailers, wholesalers, hospitality businesses, gift businesses and other commercial partners.</p>
<h2>Looking Ahead</h2>
<p>Our goal is to build long-term relationships around authentic products, dependable service and professional supply.</p>
`,
content_ar:`
<h2>الاختيار أولًا</h2>
<p>نركز على الصنف والمنشأ والمظهر والقوام والنضارة والثبات في الجودة.</p>
<h2>التقديم الاحترافي</h2>
<p>المنتجات الفاخرة تستحق تقديمًا نظيفًا وأنيقًا واحترافيًا يعزز تجربة العميل.</p>
<h2>للأفراد وقطاع الأعمال</h2>
<p>تهدف MASSAR DATES إلى خدمة العملاء الأفراد وكذلك المتاجر وتجار الجملة وقطاع الضيافة وشركات الهدايا والشركاء التجاريين.</p>
<h2>رؤيتنا للمستقبل</h2>
<p>نسعى إلى بناء علاقات طويلة الأمد تقوم على المنتجات الأصيلة والخدمة الموثوقة والتوريد الاحترافي.</p>
`,
content_ms:`
<h2>Pemilihan Adalah Keutamaan</h2>
<p>Kami memberi perhatian kepada jenis, asal, rupa, tekstur, kesegaran dan konsistensi kualiti.</p>
<h2>Persembahan Profesional</h2>
<p>Produk premium memerlukan persembahan yang bersih, elegan dan profesional.</p>
<h2>Untuk Individu dan Perniagaan</h2>
<p>MASSAR DATES menyokong pelanggan individu serta peruncit, pemborong, sektor hospitaliti, perniagaan hadiah dan rakan komersial.</p>
<h2>Menuju Masa Hadapan</h2>
<p>Kami berhasrat membina hubungan jangka panjang berasaskan produk asli, perkhidmatan yang boleh dipercayai dan bekalan profesional.</p>
`,
category:"news", featured:1, sort_order:11
}
];

const insert = db.prepare(`
INSERT INTO blog_posts
(slug,title_ar,title_en,title_ms,excerpt_ar,excerpt_en,excerpt_ms,
 content_ar,content_en,content_ms,image_url,category,published,featured,sort_order)
VALUES
(@slug,@title_ar,@title_en,@title_ms,@excerpt_ar,@excerpt_en,@excerpt_ms,
 @content_ar,@content_en,@content_ms,@image_url,@category,1,@featured,@sort_order)
ON CONFLICT(slug) DO UPDATE SET
title_ar=excluded.title_ar,
title_en=excluded.title_en,
title_ms=excluded.title_ms,
excerpt_ar=excluded.excerpt_ar,
excerpt_en=excluded.excerpt_en,
excerpt_ms=excluded.excerpt_ms,
content_ar=excluded.content_ar,
content_en=excluded.content_en,
content_ms=excluded.content_ms,
category=excluded.category,
published=1,
featured=excluded.featured,
sort_order=excluded.sort_order,
updated_at=CURRENT_TIMESTAMP
`);

const run = db.transaction(() => {
    for (const p of posts) {
        insert.run({
            ...p,
            image_url: ""
        });
    }
});

run();
console.log("SUCCESS: Multilingual MASSAR DATES blog content updated.");
console.log("TOTAL BLOG POSTS:", db.prepare("SELECT COUNT(*) AS count FROM blog_posts").get().count);
db.close();
