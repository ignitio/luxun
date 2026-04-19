import { db, collectionsTable, essaysTable } from "@workspace/db";

const collections = [
  {
    slug: "re-feng",
    titleZh: "热风",
    titlePt: "Vento Quente",
    titleEn: "Hot Wind",
    year: 1925,
    volumeNumber: 2,
    essayCount: 41,
    characteristics: "Crítica social precoce, iconoclasmo, ataque à tradição confuciana",
    isPoeticCollection: false,
    sortOrder: 1,
  },
  {
    slug: "fen",
    titleZh: "坟",
    titlePt: "A Tumba",
    titleEn: "The Grave",
    year: 1927,
    volumeNumber: 2,
    essayCount: 23,
    characteristics: "Ensaios acadêmicos sobre literatura, filosofia e cultura",
    isPoeticCollection: false,
    sortOrder: 2,
  },
  {
    slug: "hua-gai-ji",
    titleZh: "华盖集",
    titlePt: "O Galho da Caça",
    titleEn: "Galloping Gables / Bad Luck",
    year: 1926,
    volumeNumber: 3,
    essayCount: 31,
    characteristics: "Debates com rivais, polêmicas virulentas, confrontos literários",
    isPoeticCollection: false,
    sortOrder: 3,
  },
  {
    slug: "hua-gai-ji-xu-bian",
    titleZh: "华盖集续编",
    titlePt: "O Galho da Caça (Continuação)",
    titleEn: "Galloping Gables (Continued)",
    year: 1927,
    volumeNumber: 3,
    essayCount: 26,
    characteristics: "Pós-Massacre do 18 de Março, raiva e luto, repressão política",
    isPoeticCollection: false,
    sortOrder: 4,
  },
  {
    slug: "er-yi-ji",
    titleZh: "而已集",
    titlePt: "E Só Isso",
    titleEn: "And That's All",
    year: 1928,
    volumeNumber: 3,
    essayCount: 30,
    characteristics: "Pós-expurgo político de 1927, desencanto e amargura contida",
    isPoeticCollection: false,
    sortOrder: 5,
  },
  {
    slug: "ye-cao",
    titleZh: "野草",
    titlePt: "Erva Selvagem",
    titleEn: "Wild Grass",
    year: 1927,
    volumeNumber: 2,
    essayCount: 23,
    characteristics: "23 poemas em prosa — a obra mais hermética e poética de Lu Xun",
    isPoeticCollection: true,
    sortOrder: 6,
  },
  {
    slug: "san-xian-ji",
    titleZh: "三闲集",
    titlePt: "Três Ócios",
    titleEn: "Three Leisures",
    year: 1932,
    volumeNumber: 4,
    essayCount: 34,
    characteristics: "Crítica marxista, criacionismo literário, ataques ao oportunismo",
    isPoeticCollection: false,
    sortOrder: 7,
  },
  {
    slug: "er-xin-ji",
    titleZh: "二心集",
    titlePt: "Dois Corações",
    titleEn: "Two Hearts",
    year: 1932,
    volumeNumber: 4,
    essayCount: 37,
    characteristics: "\"Parcialidade para o proletariado\", crítica literária engajada",
    isPoeticCollection: false,
    sortOrder: 8,
  },
  {
    slug: "nan-qiang-bei-diao-ji",
    titleZh: "南腔北调集",
    titlePt: "Sotaques do Norte e Sul",
    titleEn: "Mixed Accents",
    year: 1934,
    volumeNumber: 4,
    essayCount: 50,
    characteristics: "Defesa contra ataques pessoais, ironia e auto-análise",
    isPoeticCollection: false,
    sortOrder: 9,
  },
  {
    slug: "wei-zi-you-shu",
    titleZh: "伪自由书",
    titlePt: "Falsa Liberdade",
    titleEn: "False Freedom",
    year: 1933,
    volumeNumber: 5,
    essayCount: 43,
    characteristics: "Era da censura da imprensa em Shanghai, pseudônimos múltiplos",
    isPoeticCollection: false,
    sortOrder: 10,
  },
  {
    slug: "zhun-feng-yue-tan",
    titleZh: "准风月谈",
    titlePt: "Quase-Fengyue",
    titleEn: "Quasi-Amorous Talks",
    year: 1934,
    volumeNumber: 5,
    essayCount: 64,
    characteristics: "Estilo \"pseudo-clássico\", ironia velada, alusões histórico-literárias",
    isPoeticCollection: false,
    sortOrder: 11,
  },
  {
    slug: "hua-bian-wen-xue",
    titleZh: "花边文学",
    titlePt: "Literatura de Renda",
    titleEn: "Lace Literature",
    year: 1936,
    volumeNumber: 5,
    essayCount: 61,
    characteristics: "Peças curtas de imprensa, \"decorativas\", crítica cultural cotidiana",
    isPoeticCollection: false,
    sortOrder: 12,
  },
  {
    slug: "qie-jie-ting-za-wen",
    titleZh: "且介亭杂文",
    titlePt: "Ensaios do Pavilhão Qiejie",
    titleEn: "Essays from Qiejie Pavilion",
    year: 1935,
    volumeNumber: 6,
    essayCount: 48,
    characteristics: "Estilo tardio maduro, isolamento em Shanghai, profundidade reflexiva",
    isPoeticCollection: false,
    sortOrder: 13,
  },
  {
    slug: "qie-jie-ting-za-wen-er-ji",
    titleZh: "且介亭杂文二集",
    titlePt: "Ensaios do Pavilhão Qiejie (Segundo Vol.)",
    titleEn: "Essays from Qiejie Pavilion Vol. 2",
    year: 1935,
    volumeNumber: 6,
    essayCount: 75,
    characteristics: "Continuação do estilo tardio, reflexões sobre arte popular e folclore",
    isPoeticCollection: false,
    sortOrder: 14,
  },
  {
    slug: "qie-jie-ting-za-wen-mo-bian",
    titleZh: "且介亭杂文末编",
    titlePt: "Ensaios do Pavilhão Qiejie (Final)",
    titleEn: "Essays from Qiejie Pavilion (Final)",
    year: 1936,
    volumeNumber: 7,
    essayCount: 35,
    characteristics: "Escritos do leito de morte, incompletos, derradeira voz de Lu Xun",
    isPoeticCollection: false,
    sortOrder: 15,
  },
  {
    slug: "ji-wai-ji",
    titleZh: "集外集",
    titlePt: "Fora do Cânon",
    titleEn: "Beyond the Canon",
    year: 1936,
    volumeNumber: 7,
    essayCount: 40,
    characteristics: "Peças iniciais não coletadas, publicadas postumamente",
    isPoeticCollection: false,
    sortOrder: 16,
  },
  {
    slug: "ji-wai-ji-shi-yi",
    titleZh: "集外集拾遗",
    titlePt: "Suplemento Fora do Cânon",
    titleEn: "Beyond the Canon — Supplement",
    year: 1938,
    volumeNumber: 7,
    essayCount: 30,
    characteristics: "Descobertas póstumas, fragmentos e escritos menores",
    isPoeticCollection: false,
    sortOrder: 17,
  },
];

const essays = [
  {
    essayId: "lx_19260401_001",
    titlePt: "Em Memória da Senhorita Liu Hezhen",
    titleZh: "记念刘和珍君",
    titlePinyin: "Jì Niàn Liú Hé Zhēn Jūn",
    collectionSlug: "hua-gai-ji-xu-bian",
    volumeNumber: 3,
    firstPublishedDate: "1926-04-01",
    firstPublishedVenueZh: "语丝",
    firstPublishedVenuePt: "Yusi (Fio de Linguagem)",
    pseudonymUsed: null,
    pseudonymNotePt: null,
    essayType: "ensaio",
    genreTagsPt: ["memória", "crítica política", "luto", "massacre"],
    genreTagsZh: ["纪念文", "政治批评", "悼文"],
    themesPt: ["violência estatal", "coragem feminina", "memória e esquecimento", "silêncio e resistência"],
    historicalContextPt: `Escrito em 1º de abril de 1926, em resposta ao Massacre do Dia 18 de Março (三一八惨案). Em 18 de março de 1926, cerca de 5.000 estudantes e cidadãos de Pequim marcharam até o escritório executivo do governo de guerra de Duan Qirui para protestar contra a imposição militar japonesa na China. As tropas do governo abriram fogo contra os manifestantes desarmados, matando 47 pessoas e ferindo mais de 200. Liu Hezhen (刘和珍, 1904–1926), estudante da Universidade Normal Feminina de Pequim e ativista estudantil, tinha 22 anos quando foi morta. Sua morte, junto com Yang Dequn e outras, chocou profundamente Lu Xun e a intelligentsia chinesa.`,
    contentOriginalZh: `一

中华民国十五年三月二十五日，就是国立北京女子师范大学为十八日在段祺瑞执政府前遇害的刘和珍杨德群两君开追悼会的那一天，我独在礼堂外徘徊，遇见程君，前来问我道，"先生可曾为刘和珍写了一点什么没有？"我说"没有"。她就正告我，"先生还是写一点罢；刘和珍生前就很爱看先生的文章。"

这是我知道的，凡我所编辑的期刊，大概是因为往往有始无终之故罢，销行一向就甚为寥落，然而在这样的生活艰难中，毅然预定了《莽原》全年的就有她。我也早觉得有写一点东西的必要了，这虽然于死者毫不相干，但在生者，却大抵只能如此而已。倘使我能够相信真有所谓"在天之灵"，那自然可以得到更大的安慰，——但是，现在，却只能如此而已。

可是我实在无话可说。我只觉得所住的并非人间。四十多个青年的血，洋溢在我的周围，使我艰于呼吸视听，那里还能有什么言语？长歌当哭，是必须在痛定之后的。而此后几个所谓学者文人的阴险的论调，尤使我觉得悲哀。我已经出离愤怒了。我将深味这非人间的浓黑的悲凉；以我的最大哀痛显示于非人间，使它们快意于我的苦痛，就将这作为后死者的菲薄的祭品，奉献于逝者的灵前。

---

二

真的猛士，敢于直面惨淡的人生，敢于正视淋漓的鲜血。这是怎样的哀痛者和幸福者？然而造化又常常为庸人设计，以时间的流驶，来洗涤旧迹，仅使留下淡红的血色和微漠的悲哀。在这淡红的血色和微漠的悲哀中，又给人暂得偷生，维持着这似人非人的世界。我不知道这样的世界何时是一个尽头！

我们还在这样的世上活着；我也早觉得有写一点东西的必要了。离三月十八日也已有两星期，忘却的救主快要降临了罢，我正有写一点东西的必要了。

---

三

在四十余被害的青年之中，刘和珍君是我的学生。学生云者，我向来这样想，这样说，现在却觉得有些踌躇了，我应该对她奉献我的悲哀与尊敬。她不是"苟活到现在的我"的学生，是为了中国而死的中国的青年。

她的姓名第一次为我所见，是在去年夏初杨荫榆女士做女子师范大学校长，开除校中六个学生自治会职员的时候。其中的一个就是她；但是我不认识。直到后来，也许已经是刘百昭率领男女武将，强拖出校之后了，才有人指着一个学生告诉我，说：这就是刘和珍。其时我才能将姓名和实体联合起来，心中却暗自诧异。我平素想，能够不为势利所屈，反抗一广有羽翼的校长的学生，无论如何总该是有些桀骜锋利的，但她却常常微笑着，态度很温和。待到偏安于宗帽胡同，赁屋授课之后，她才始来听我的讲义，于是见面的回数就较多了，也还是始终微笑着，态度很温和。待到学校恢复旧观，往日的教职员以为责任已尽，准备陆续引退的时候，我才见她虑及母校前途，黯然至于泣下。此后似乎就不相见。总之，在我的记忆上，那一次就是永别了。

---

四

我在十八日早晨，才知道上午有群众向执政府请愿的事；下午便得到噩耗，说卫队居然开枪，死伤至数百人，而刘和珍君即在遇害者之列。但我对于这些传说，竟至于颇为怀疑。我向来是不惮以最坏的恶意，来推测中国人的，然而我还不料，也不信竟会下劣凶残到这地步。况且始终微笑着的和蔼的刘和珍君，更何至于无端在府门前喋血呢？

然而即日证明是事实了，作证的便是她自己的尸骸。还有一具，是杨德群君的。而且又证明着这不但是杀害，简直是虐杀，因为身体上还有棍棒的伤痕。

但段政府就有令，说她们是"暴徒"！

但接着就有流言，说她们是受人利用的。

惨象，已使我目不忍视了；流言，尤使我耳不忍闻。我还有什么话可说呢？我懂得衰亡民族之所以默无声息的缘由了。沉默呵，沉默呵！不在沉默中爆发，就在沉默中灭亡。

---

五

但是，我还有要说的话。

我没有亲见；听说，她，刘和珍君，那时是欣然前往的。自然，请愿而已，稍有人心者，谁也不会料到有这样的罗网。但竟在执政府前中弹了，从背部入，斜穿心肺，已是致命的创伤，只是没有便死。同去的张静漪君想扶起她，中了四弹，也立仆；同去的杨德群君又想去扶起她，也被击，弹从左肩入，穿胸偏右出，也立仆。但她还能坐起来，一个兵在她头部及胸部猛击两棍，于是死掉了。

始终微笑的和蔼的刘和珍君确是死掉了，这是真的，有她自己的尸骸为证；沉勇而友爱的杨德群君也死掉了，有她自己的尸骸为证；只有一样沉勇而友爱的张静漪君还在医院里呻吟。当三个女子从容地转辗于文明人所发明的枪弹的攒射中的时候，这是怎样的一个惊心动魄的伟大呵！中国军人的屠戮妇婴的伟绩，八国联军的惩创学生的武功，不幸全被这几缕血痕抹杀了。

但是中外的杀人者却居然昂起头来，不知道个个脸上有着血污……。

---

六

时间永是流驶，街市依旧太平，有限的几个生命，在中国是不算什么的，至多，不过供无恶意的闲人以饭后的谈资，或者给有恶意的闲人作"流言"的种子。至于此外的深的意义，我总觉得很寥寥，因为这实在不过是徒手的请愿。人类的血战前行的历史，正如煤的形成，当时用大量的木材，结果却只是一小块，但请愿是不在其中的，更何况是徒手。

然而既然有了血痕了，当然不觉要扩大。至少，也当浸渍了亲族；师友，爱人的心，纵使时光流驶，洗成绯红，也会在微漠的悲哀中永存微笑的和蔼的旧影。陶潜说过，"亲戚或余悲，他人亦已歌，死去何所道，托体同山阿。"倘能如此，这也就够了。

---

七

我已经说过：我向来是不惮以最坏的恶意来推测中国人的。但这回却很有几点出于我的意外。一是当局者竟会这样地凶残，一是流言家竟至如此之下劣，一是中国的女性临难竟能如是之从容。

我目睹中国女子的办事，是始于去年的，虽然是少数，但看那干练坚决，百折不回的气概，曾经屡次为之感叹。至于这一回在弹雨中互相救助，虽殒身不恤的事实，则更足为中国女子的勇毅，虽遭阴谋秘计，压抑至数千年，而终于没有消亡的明证了。倘要寻求这一次死伤者对于将来的意义，意义就在此罢。

苟活者在淡红的血色中，会依稀看见微茫的希望；真的猛士，将更奋然而前行。

呜呼，我说不出话，但以此记念刘和珍君！

四月一日。`,
    contentModernZh: `一

1926年3月25日，国立北京女子师范大学为18日在段祺瑞执政府前遇难的刘和珍、杨德群两位同学举行追悼会。那天，我独自在礼堂外徘徊，遇见程君，她走过来问我："先生为刘和珍写过什么吗？"我说"没有"。她郑重地告诉我："先生还是写一点吧；刘和珍生前很爱看先生的文章。"

这我知道。凡是我编辑的刊物，往往因为有始无终，销路一向不好，但在这样艰难的生活中，她却毅然预定了全年的《莽原》。我也早觉得有写一点东西的必要——虽然这对死者毫无意义，但对活着的人，也只能如此了。如果真有"在天之灵"，那自然能得到更大的安慰，但现在，只能如此。

可是我实在无话可说。我只觉得所住的地方不是人间。四十多个青年的血，洋溢在我周围，使我呼吸困难，视听模糊，哪里还能说话？用长歌代替痛哭，必须在痛苦平定之后。而此后几个所谓学者文人的阴险论调，更使我悲哀。我已经出离愤怒了。我要深深体味这人间的黑暗悲凉；用我最大的哀痛展示给这个世界，让他们以我的痛苦为乐，就将这作为后死者的微薄祭品，献给逝者的灵前。

---

二

真正的勇士，敢于直面惨淡的人生，敢于正视淋漓的鲜血。这是怎样的哀痛者和幸福者？然而造物主常常为庸人设计，用时间的流逝来洗涤旧迹，只留下淡红的血色和微漠的悲哀。在这淡红的血色和微漠的悲哀中，人们又能暂得偷生，维持这似人非人的世界。我不知道这样的世界何时是尽头！

我们还活在这样的世上；我也早觉得有写一点东西的必要。离三月十八日已两星期，忘却的救主快要降临了，我正有写一点东西的必要。

---

三

在四十多个被害青年中，刘和珍是我的学生。"学生"这个词，我向来这样想、这样说，现在却有些踌躇了——我应该对她奉献我的悲哀与尊敬。她不是"苟活到现在的我"的学生，是为了中国而死的中国的青年。

---

四

十八日早晨，我才知道上午有群众向执政府请愿的事；下午便得到噩耗，说卫队居然开枪，死伤数百人，刘和珍君即在遇害者之列。但我对这些传说，竟颇为怀疑。

然而当日便证明是事实了，作证的就是她自己的尸骸。而且又证明这不仅是杀害，简直是虐杀，因为身体上还有棍棒的伤痕。

但段政府却下令，说她们是"暴徒"！

沉默呵，沉默呵！不在沉默中爆发，就在沉默中灭亡。

---

五

但是，我还有要说的话。

听说，刘和珍君那时是欣然前往的。但竟在执政府前中弹了，从背部入，斜穿心肺，已是致命创伤。始终微笑的和蔼的刘和珍君确实死掉了；沉勇而友爱的杨德群君也死掉了。当三个女子从容地辗转于文明人所发明的枪弹攒射中，这是怎样的一个惊心动魄的伟大呵！

---

六

时间永是流逝，街市依旧太平，有限的几个生命，在中国是不算什么的。人类血战前行的历史，正如煤的形成，当时用大量的木材，结果却只是一小块，但请愿是不在其中的。

陶潜说过："亲戚或余悲，他人亦已歌，死去何所道，托体同山阿。"倘能如此，也就够了。

---

七

我已经说过：我向来不惮以最坏的恶意推测中国人。但这回有三点出乎我意外：当局之凶残，流言家之下劣，中国女性临难之从容。

苟活者在淡红的血色中，会依稀看见微茫的希望；真的猛士，将更奋然而前行。

呜呼，我说不出话，但以此记念刘和珍君！`,
    contentPinyin: `Yī

Zhōnghuá Mínguó shíwǔ nián sān yuè èrshíwǔ rì, jiùshì Guólì Běijīng Nǚzǐ Shīfàn Dàxué wèi shíbā rì zài Duàn Qíruì zhízhèngfǔ qián yùhài de Liú Hézhēn Yáng Déqún liǎng jūn kāi zhuīdào huì de nà yī tiān, wǒ dú zài lǐtáng wài páihuái, yùjiàn Chéng jūn, qiánlái wèn wǒ dào: "Xiānsheng kě céng wèi Liú Hézhēn xiě le yīdiǎn shénme méiyǒu?" Wǒ shuō "méiyǒu". Tā jiù zhènggào wǒ: "Xiānsheng háishi xiě yīdiǎn ba; Liú Hézhēn shēngqián jiù hěn ài kàn xiānsheng de wénzhāng."

Zhèn shì wǒ zhīdào de...

Ér

Zhēn de měngshì, gǎnyú zhímiàn cǎndàn de rénshēng, gǎnyú zhèngshì línlí de xiānxuè. Zhè shì zěnyàng de āitòng zhě hé xìngfú zhě?

Sānlíng

Zài sìshí yú bèihài de qīngnián zhī zhōng, Liú Hézhēn jūn shì wǒ de xuésheng...

Sìlíng

Wǒ zài shíbā rì zǎochén, cái zhīdào shàngwǔ yǒu qúnzhòng xiàng zhízhèngfǔ qǐngyuàn de shì...

Wǔlíng

Dànshì, wǒ hái yǒu yào shuō de huà...

Liùlíng

Shíjiān yǒng shì liú shǐ, jiēshì yījiù tàipíng...

Qīlíng

Wǒ yǐjīng shuōguò: wǒ xiànglái shì bù dàn yǐ zuì huài de èyì lái tuīcè Zhōngguó rén de...

Gǒuhuó zhě zài dàn hóng de xuèsè zhōng, huì yīxī kànjiàn wēimáng de xīwàng; zhēn de měngshì, jiāng gèng fènrán ér qiánxíng.

Wūhū, wǒ shuō bù chū huà, dàn yǐ cǐ jìniàn Liú Hézhēn jūn!`,
    contentPt: `**I**

Em 25 de março de 1926, dia em que a Universidade Normal Feminina Nacional de Pequim realizou um memorial para Liu Hezhen e Yang Dequn, mortas no dia 18 em frente ao escritório executivo do governo de Duan Qirui, eu estava vagando sozinho do lado de fora do auditório quando encontrei a senhorita Cheng, que veio me perguntar: "Senhor, o senhor escreveu algo para Liu Hezhen?" Eu disse: "Não." Ela então me disse seriamente: "Senhor, o senhor deveria escrever algo. Liu Hezhen adorava ler seus artigos enquanto estava viva."

Eu sabia disso. Todos os periódicos que eu editava, provavelmente porque frequentemente começavam mas nunca terminavam, sempre venderam mal. No entanto, em circunstâncias tão difíceis, ela resolutamente assinou o ano inteiro de *Mangyuan*. Eu também há muito sentia a necessidade de escrever algo — embora não signifique nada para os mortos, mas para os vivos, isso é tudo o que posso fazer. Se eu pudesse acreditar que existe realmente algo como um "espírito no céu", naturalmente ganharia maior conforto — mas agora, isso é tudo o que posso fazer.

Mas eu realmente não tenho nada a dizer. Só sinto que onde vivo não é o mundo dos homens. O sangue de mais de quarenta jovens flui ao meu redor, dificultando minha respiração, minha visão, minha audição — como poderia eu ter palavras? Só depois que a dor subsede é que se pode cantar canções longas em lugar de lamentos. E os argumentos sinistros de certos chamados eruditos e literatos que se seguiram me deixaram ainda mais triste. Eu fui além da raiva. Vou saborear profundamente esta tristeza densa e escura deste mundo desumano; exibir meu maior pesar diante deste mundo desumano, deixando que eles se deleitem com meu sofrimento — e oferecer isto como o humilde sacrifício de quem sobrevive, para depositar diante dos espíritos dos falecidos.

---

**II**

Verdadeiros guerreiros ousam encarar diretamente a desolação da vida, ousam olhar de frente para o sangue escorrendo. Que tipo de almas aflitas e abençoadas são eles? No entanto, o destino frequentemente desenha para as pessoas medianas, usando o fluxo do tempo para lavar as velhas marcas, deixando apenas manchas de sangue pálido-vermelho e tristeza leve. Neste sangue pálido-vermelho e tristeza leve, as pessoas podem temporariamente roubar uma existência, mantendo este mundo que parece humano mas não é. Não sei quando este mundo terá fim!

Ainda vivemos em tal mundo; eu também há muito senti a necessidade de escrever algo. Duas semanas se passaram desde 18 de março; o salvador do esquecimento logo chegará — eu realmente preciso escrever algo.

---

**III**

Entre as mais de quarenta jovens vítimas, Liu Hezhen era minha aluna. "Aluna" — sempre pensei e falei assim, mas agora hesito. Devo oferecer a ela minha tristeza e meu respeito. Ela não era uma aluna de "alguém que meramente sobrevive como eu hoje", mas uma jovem chinesa que morreu pela China.

A primeira vez que vi seu nome foi no início do verão passado, quando a senhora Yang Yinyu era presidente da Universidade Normal Feminina e expulsou seis oficiais do sindicato estudantil. Uma delas era ela, mas eu não a conhecia. Só mais tarde alguém apontou uma estudante para mim e disse: Esta é Liu Hezhen. Ela estava sempre sorrindo, seu modo muito gentil. Na minha memória, aquela foi nossa despedida eterna.

---

**IV**

Na manhã do dia 18, soube da petição ao governo naquela manhã; à tarde veio a notícia terrível de que os guardas realmente abriram fogo, matando e ferindo centenas, e Liu Hezhen estava entre as vítimas.

Mas naquele mesmo dia provou-se verdade; a prova foi seu próprio cadáver. E isso ainda provou que não era apenas assassinato, mas assassinato cruel, pois havia também marcas de golpes de porrete no corpo.

Mas o governo de Duan emitiu uma ordem, dizendo que elas eram "baderneiras"!

O espetáculo trágico já faz meus olhos relutarem em olhar; os rumores fazem meus ouvidos relutarem em ouvir. *Silêncio, silêncio! Ou explode no silêncio, ou perece no silêncio.*

---

**V**

Mas ainda tenho palavras a dizer.

Eu não presenciei; ouvi dizer que Liu Hezhen foi voluntariamente naquele dia. Mas ela foi realmente baleada em frente ao escritório do governo, entrando pelas costas, atravessando diagonalmente coração e pulmões — um ferimento fatal. A sempre sorridente e gentil Liu Hezhen realmente morreu. Quando três mulheres se moveram calmamente em meio ao fogo concentrado de balas inventado por pessoas civilizadas — que grandeza emocionante foi essa!

---

**VI**

O tempo flui para sempre, as ruas permanecem pacíficas. Algumas poucas vidas limitadas não significam nada na China — no máximo, fornecem material para conversa ociosa ou sementes para "rumores".

Tao Qian disse: *"Parentes podem ainda lamentar, outros já cantaram — o que há para dizer da morte? O corpo retorna às mesmas colinas."* Se puder ser assim, isso é suficiente.

---

**VII**

Eu disse: nunca temi suspeitar dos chineses com a pior maldade possível. Mas desta vez, várias coisas me surpreenderam. Primeiro, que as autoridades poderiam ser tão cruéis; segundo, que os propagadores de rumores poderiam ser tão vis; terceiro, que as mulheres chinesas poderiam encarar a morte com tanta compostura.

Aqueles que meramente sobrevivem podem ver vagamente uma esperança débil no sangue pálido-vermelho; verdadeiros guerreiros avançarão ainda mais resolutamente.

*Ah, eu não tenho palavras — mas ofereço isto em memória de Liu Hezhen!*

1º de abril.`,
    translatorName: "Arquivo Lu Xun Digital",
    translationNotesPt: "Tradução baseada na versão publicada originalmente em Yusi (语丝) em 1926. A expressão '苟活' (gǒuhuó) é traduzida como 'meramente sobreviver' — carregando a conotação de sobrevivência vergonhosa ou covarde. A referência a Tao Qian (陶渊明, 365–427 d.C.) é de seu poema 'Elegia para Si Mesmo' (拟挽歌辞), enfatizando a inevitabilidade da morte e a dissolução do corpo na natureza.",
    sourceTextEdition: "鲁迅全集 (2005版), 人民文学出版社, Vol. 3 (华盖集续编), pp. 279-287",
    difficultyLevel: "advanced",
    estimatedReadingTime: 15,
    wordCountPt: 2800,
    wordCountZh: 1800,
    isFeatured: true,
  },
  {
    essayId: "lx_19180504_001",
    titlePt: "Diário de um Louco",
    titleZh: "狂人日记",
    titlePinyin: "Kuángrén Rìjì",
    collectionSlug: "re-feng",
    volumeNumber: 2,
    firstPublishedDate: "1918-05-04",
    firstPublishedVenueZh: "新青年",
    firstPublishedVenuePt: "Nova Juventude (Xin Qingnian)",
    pseudonymUsed: "Lu Xun",
    pseudonymNotePt: "Primeiro uso do pseudônimo 'Lu Xun' (鲁迅), escolhido nesta ocasião histórica",
    essayType: "ficção",
    genreTagsPt: ["crítica cultural", "canibalismo metafórico", "modernidade", "tradição"],
    genreTagsZh: ["小说", "文化批评", "象征主义"],
    themesPt: ["canibalismo cultural", "tradição confuciana", "loucura como lucidez", "modernidade"],
    historicalContextPt: "Considerado o primeiro conto moderno em chinês vernacular (白话文), publicado em resposta ao Movimento da Nova Cultura. O protagonista 'louco' que vê 'comer gente' escrito em todos os textos clássicos é uma crítica radical ao confucionismo e à cultura tradicional chinesa.",
    contentPt: "**[Conteúdo disponível na edição completa]**\n\nEste é o conto inaugural da ficção moderna chinesa. Narrado por um homem que gradualmente percebe que todos ao seu redor são 'canibais' — metáfora para a crueldade da tradição confuciana que devora os indivíduos em nome da ordem social.",
    difficultyLevel: "advanced",
    estimatedReadingTime: 20,
    wordCountPt: 3200,
    wordCountZh: 2100,
    isFeatured: true,
  },
  {
    essayId: "lx_19250101_001",
    titlePt: "Como Deve Ser a Nova Literatura",
    titleZh: "论睁了眼看",
    titlePinyin: "Lùn Zhēng Le Yǎn Kàn",
    collectionSlug: "re-feng",
    volumeNumber: 2,
    firstPublishedDate: "1925-07-10",
    firstPublishedVenueZh: "语丝",
    firstPublishedVenuePt: "Yusi (Fio de Linguagem)",
    pseudonymUsed: null,
    pseudonymNotePt: null,
    essayType: "crônica",
    genreTagsPt: ["teoria literária", "modernismo", "crítica cultural"],
    genreTagsZh: ["文学理论", "现代主义"],
    themesPt: ["literatura e verdade", "ver o mundo com olhos abertos", "realismo"],
    historicalContextPt: "Escrito durante o Movimento de 4 de Maio, quando Lu Xun debatia a função da nova literatura chinesa. Defendia uma arte que olhasse a realidade social diretamente, sem véus idealizantes.",
    contentPt: "**[Conteúdo disponível na edição completa]**\n\nEnsaio programático sobre a responsabilidade da literatura chinesa moderna de enfrentar a realidade social sem autoengano.",
    difficultyLevel: "intermediate",
    estimatedReadingTime: 10,
    wordCountPt: 1500,
    wordCountZh: 980,
    isFeatured: false,
  },
  {
    essayId: "lx_19260318_001",
    titlePt: "Sobre o '3.18'",
    titleZh: "无花的蔷薇之二",
    titlePinyin: "Wú Huā de Qiángwēi zhī Èr",
    collectionSlug: "hua-gai-ji-xu-bian",
    volumeNumber: 3,
    firstPublishedDate: "1926-03-20",
    firstPublishedVenueZh: "语丝",
    firstPublishedVenuePt: "Yusi (Fio de Linguagem)",
    pseudonymUsed: null,
    pseudonymNotePt: null,
    essayType: "crônica",
    genreTagsPt: ["massacre", "crítica política", "raiva", "luto"],
    genreTagsZh: ["政论", "时评", "抗议"],
    themesPt: ["Massacre do 18 de Março", "violência do governo", "resistência estudantil"],
    historicalContextPt: "Escrito dois dias após o Massacre do 18 de Março de 1926. Este é o primeiro texto de Lu Xun em resposta ao massacre, escrito em estado de choque e raiva imediatos.",
    contentPt: "**[Conteúdo disponível na edição completa]**\n\nPrimeira reação de Lu Xun ao Massacre do 18 de Março, escrita em choque e indignação.",
    difficultyLevel: "intermediate",
    estimatedReadingTime: 8,
    wordCountPt: 1200,
    wordCountZh: 800,
    isFeatured: true,
  },
  {
    essayId: "lx_19270401_001",
    titlePt: "Esperança",
    titleZh: "希望",
    titlePinyin: "Xīwàng",
    collectionSlug: "ye-cao",
    volumeNumber: 2,
    firstPublishedDate: "1925-01-01",
    firstPublishedVenueZh: "语丝",
    firstPublishedVenuePt: "Yusi (Fio de Linguagem)",
    pseudonymUsed: null,
    pseudonymNotePt: null,
    essayType: "poesia em prosa",
    genreTagsPt: ["poesia em prosa", "filosofia", "esperança e desespero", "lírica"],
    genreTagsZh: ["散文诗", "哲学", "抒情"],
    themesPt: ["esperança", "juventude e velhice", "vazio existencial", "luta"],
    historicalContextPt: "Poema em prosa da coleção 野草 (Erva Selvagem), escrita entre 1924-1926. Esta é a obra mais introspectiva de Lu Xun, escrita em momentos de dúvida pessoal e crise histórica.",
    contentPt: "**[Conteúdo disponível na edição completa]**\n\nPoema em prosa sobre a relação paradoxal com a esperança — a única coisa que sobrevive mesmo quando se perde a crença nela.",
    difficultyLevel: "advanced",
    estimatedReadingTime: 5,
    wordCountPt: 600,
    wordCountZh: 400,
    isFeatured: true,
  },
  {
    essayId: "lx_19330415_001",
    titlePt: "Perguntas Feitas à Noite",
    titleZh: "夜颂",
    titlePinyin: "Yè Sòng",
    collectionSlug: "hua-bian-wen-xue",
    volumeNumber: 5,
    firstPublishedDate: "1933-04-15",
    firstPublishedVenueZh: "申报·自由谈",
    firstPublishedVenuePt: "Shenbao — Página Liberdade",
    pseudonymUsed: "You Zhi",
    pseudonymNotePt: "游识 (You Zhi) — um dos mais de 100 pseudônimos usados por Lu Xun para evitar a censura da imprensa durante o período de repressão nacionalista em Shanghai",
    essayType: "crônica",
    genreTagsPt: ["sátira política", "crítica cultural", "ironia", "noite e luz"],
    genreTagsZh: ["讽刺", "时评", "政论"],
    themesPt: ["censura à imprensa", "hipocrisia social", "noite como refúgio", "luz e trevas"],
    historicalContextPt: "Escrito durante a 'Supressão da Imprensa de Shanghai' (1933-1934), quando o governo nacionalista exigiu pré-registro de todos os artigos. Lu Xun publicava em jornais progressistas usando pseudônimos para evitar prisão.",
    contentPt: "**[Conteúdo disponível na edição completa]**\n\nSátira sobre a preferência pela noite — o único momento em que a hipocrisia dorme e a realidade pode ser vista.",
    difficultyLevel: "intermediate",
    estimatedReadingTime: 6,
    wordCountPt: 900,
    wordCountZh: 600,
    isFeatured: false,
  },
];

export async function seed() {
  await db
    .insert(collectionsTable)
    .values(collections)
    .onConflictDoNothing();

  for (const essay of essays) {
    await db.insert(essaysTable).values(essay).onConflictDoNothing();
  }
}
