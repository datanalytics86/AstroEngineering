STEMS = [
    {"chinese": "甲", "pinyin": "Jia",  "element": "Yang Wood",  "element_base": "Wood",  "polarity": "yang"},
    {"chinese": "乙", "pinyin": "Yi",   "element": "Yin Wood",   "element_base": "Wood",  "polarity": "yin"},
    {"chinese": "丙", "pinyin": "Bing", "element": "Yang Fire",  "element_base": "Fire",  "polarity": "yang"},
    {"chinese": "丁", "pinyin": "Ding", "element": "Yin Fire",   "element_base": "Fire",  "polarity": "yin"},
    {"chinese": "戊", "pinyin": "Wu",   "element": "Yang Earth", "element_base": "Earth", "polarity": "yang"},
    {"chinese": "己", "pinyin": "Ji",   "element": "Yin Earth",  "element_base": "Earth", "polarity": "yin"},
    {"chinese": "庚", "pinyin": "Geng", "element": "Yang Metal", "element_base": "Metal", "polarity": "yang"},
    {"chinese": "辛", "pinyin": "Xin",  "element": "Yin Metal",  "element_base": "Metal", "polarity": "yin"},
    {"chinese": "壬", "pinyin": "Ren",  "element": "Yang Water", "element_base": "Water", "polarity": "yang"},
    {"chinese": "癸", "pinyin": "Gui",  "element": "Yin Water",  "element_base": "Water", "polarity": "yin"},
]

BRANCHES = [
    {"chinese": "子", "pinyin": "Zi",   "animal": "Rat",     "animal_es": "Rata",      "element_base": "Water"},
    {"chinese": "丑", "pinyin": "Chou", "animal": "Ox",      "animal_es": "Buey",      "element_base": "Earth"},
    {"chinese": "寅", "pinyin": "Yin",  "animal": "Tiger",   "animal_es": "Tigre",     "element_base": "Wood"},
    {"chinese": "卯", "pinyin": "Mao",  "animal": "Rabbit",  "animal_es": "Conejo",    "element_base": "Wood"},
    {"chinese": "辰", "pinyin": "Chen", "animal": "Dragon",  "animal_es": "Dragón",    "element_base": "Earth"},
    {"chinese": "巳", "pinyin": "Si",   "animal": "Snake",   "animal_es": "Serpiente", "element_base": "Fire"},
    {"chinese": "午", "pinyin": "Wu",   "animal": "Horse",   "animal_es": "Caballo",   "element_base": "Fire"},
    {"chinese": "未", "pinyin": "Wei",  "animal": "Goat",    "animal_es": "Cabra",     "element_base": "Earth"},
    {"chinese": "申", "pinyin": "Shen", "animal": "Monkey",  "animal_es": "Mono",      "element_base": "Metal"},
    {"chinese": "酉", "pinyin": "You",  "animal": "Rooster", "animal_es": "Gallo",     "element_base": "Metal"},
    {"chinese": "戌", "pinyin": "Xu",   "animal": "Dog",     "animal_es": "Perro",     "element_base": "Earth"},
    {"chinese": "亥", "pinyin": "Hai",  "animal": "Pig",     "animal_es": "Cerdo",     "element_base": "Water"},
]

ANIMAL_EMOJIS = {
    "Rat": "🐀", "Ox": "🐂", "Tiger": "🐯", "Rabbit": "🐇",
    "Dragon": "🐉", "Snake": "🐍", "Horse": "🐴", "Goat": "🐐",
    "Monkey": "🐒", "Rooster": "🐓", "Dog": "🐕", "Pig": "🐷",
}

HIDDEN_STEMS = {
    0:  [(8, 0.7), (9, 0.3)],
    1:  [(5, 0.6), (9, 0.3), (7, 0.1)],
    2:  [(0, 0.6), (2, 0.3), (4, 0.1)],
    3:  [(1, 1.0)],
    4:  [(4, 0.6), (1, 0.3), (9, 0.1)],
    5:  [(2, 0.6), (6, 0.3), (4, 0.1)],
    6:  [(3, 0.7), (5, 0.3)],
    7:  [(5, 0.6), (3, 0.2), (1, 0.2)],
    8:  [(6, 0.6), (8, 0.3), (4, 0.1)],
    9:  [(7, 1.0)],
    10: [(4, 0.6), (7, 0.3), (3, 0.1)],
    11: [(8, 0.7), (0, 0.3)],
}

ELEMENT_OF_STEM = {0:"Wood",1:"Wood",2:"Fire",3:"Fire",4:"Earth",5:"Earth",6:"Metal",7:"Metal",8:"Water",9:"Water"}

# Productive cycle: Wood->Fire->Earth->Metal->Water->Wood
# Control cycle: Wood->Earth, Fire->Metal, Earth->Water, Metal->Wood, Water->Fire
PRODUCES = {"Wood":"Fire","Fire":"Earth","Earth":"Metal","Metal":"Water","Water":"Wood"}
CONTROLS = {"Wood":"Earth","Fire":"Metal","Earth":"Water","Metal":"Wood","Water":"Fire"}

MONTH1_STEM = {0:2,5:2,1:4,6:4,2:6,7:6,3:8,8:8,4:0,9:0}
ZI_STEM     = {0:0,5:0,1:2,6:2,2:4,7:4,3:6,8:6,4:8,9:8}

# Approximate Jie Qi days (month, day) for each Chinese solar month start
JIEQI = [
    (2, 4),   # Month 1  Li Chun -> Tiger
    (3, 6),   # Month 2  Jing Zhe -> Rabbit
    (4, 5),   # Month 3  Qing Ming -> Dragon
    (5, 6),   # Month 4  Li Xia -> Snake
    (6, 6),   # Month 5  Mang Zhong -> Horse
    (7, 7),   # Month 6  Xiao Shu -> Goat
    (8, 7),   # Month 7  Li Qiu -> Monkey
    (9, 8),   # Month 8  Bai Lu -> Rooster
    (10, 8),  # Month 9  Han Lu -> Dog
    (11, 7),  # Month 10 Li Dong -> Pig
    (12, 7),  # Month 11 Da Xue -> Rat
    (1, 6),   # Month 12 Xiao Han -> Ox
]

DAY_MASTERS = {
    0: {"pinyin":"Jia","title":"El Gran Árbol","element":"Yang Wood",
        "description":"Jia es el primer Tronco Celestial. Representa el árbol grande, el tronco recto, el roble centenario que crece hacia el cielo. Personalidad directa, honesta y generosa. Naturalmente líder.",
        "strengths":["Rectitud","Crecimiento","Generosidad protectora","Liderazgo natural"],
        "vulnerabilities":["Rigidez","Dificultad para pedir ayuda","Terquedad ante el cambio"]},
    1: {"pinyin":"Yi","title":"La Enredadera, el Bambú","element":"Yin Wood",
        "description":"Yi es madera flexible, la enredadera que encuentra cualquier grieta para crecer. Diplomática, elegante y resiliente. Se adapta sin perder su esencia.",
        "strengths":["Flexibilidad","Diplomacia","Resiliencia","Elegancia natural"],
        "vulnerabilities":["Indecisión","Dependencia emocional","Evita la confrontación directa"]},
    2: {"pinyin":"Bing","title":"El Sol","element":"Yang Fire",
        "description":"Bing es el sol — generoso, cálido, visible, imposible de ignorar. Irradia energía y optimismo. Nació para brillar y elevar a quienes lo rodean.",
        "strengths":["Carisma","Optimismo","Franqueza","Liderazgo natural"],
        "vulnerabilities":["Intensidad excesiva","Dificultad para ser sutil","Riesgo de burnout"]},
    3: {"pinyin":"Ding","title":"La Vela, la Hoguera","element":"Yin Fire",
        "description":"Ding es el fuego íntimo — la vela que ilumina con precisión, la hoguera que calienta un espacio pequeño. Profundo, intuitivo y selectivo con su energía.",
        "strengths":["Profundidad","Intuición","Calidez íntima","Enfoque preciso"],
        "vulnerabilities":["Ansiedad","Intensidad emocional","Tendencia a los celos"]},
    4: {"pinyin":"Wu","title":"La Montaña, la Roca","element":"Yang Earth",
        "description":"Wu es la montaña — sólido, inamovible, confiable, imponente. Protege y sostiene. Su presencia inspira seguridad en quienes lo rodean.",
        "strengths":["Estabilidad","Confiabilidad","Paciencia","Fortaleza interior"],
        "vulnerabilities":["Obstinación","Lentitud para adaptarse","Tendencia al aislamiento"]},
    5: {"pinyin":"Ji","title":"La Tierra Fértil","element":"Yin Earth",
        "description":"Ji es el suelo que nutre — fértil, suave, receptivo, donde todo puede crecer. Cuida y sirve naturalmente. Encuentra satisfacción en el apoyo a otros.",
        "strengths":["Nutrición","Adaptabilidad","Humildad","Servicio genuino"],
        "vulnerabilities":["Preocupación excesiva","Overthinking","Sacrificio propio"]},
    6: {"pinyin":"Geng","title":"La Espada, el Hacha","element":"Yang Metal",
        "description":"Geng es metal duro — la espada forjada, el hacha que corta. Justicia, decisión, acción directa. No teme el conflicto cuando hay principios en juego.",
        "strengths":["Justicia","Decisión","Coraje","Lealtad inquebrantable"],
        "vulnerabilities":["Agresividad","Impulsividad","Falta de tacto"]},
    7: {"pinyin":"Xin","title":"La Joya, el Bisturí","element":"Yin Metal",
        "description":"Xin es metal refinado — la joya pulida, el bisturí de precisión. Estética, elocuencia y sensibilidad exquisita. Busca la perfección en todo lo que toca.",
        "strengths":["Elegancia","Precisión","Sensibilidad estética","Elocuencia"],
        "vulnerabilities":["Vanidad","Hipersensibilidad","Tendencia al resentimiento"]},
    8: {"pinyin":"Ren","title":"El Océano, el Río","element":"Yang Water",
        "description":"Ren es el agua en movimiento — el océano, el río caudaloso. Ambicioso, inteligente y capaz de fluir alrededor de cualquier obstáculo. Visión amplia.",
        "strengths":["Ambición","Inteligencia","Adaptabilidad","Visión estratégica"],
        "vulnerabilities":["Dispersividad","Impaciencia","Dominación sutil"]},
    9: {"pinyin":"Gui","title":"El Rocío, la Lluvia Fina","element":"Yin Water",
        "description":"Gui es el agua sutil — rocío, niebla, lluvia fina que nutre sin que nadie lo note. Percepción profunda, intuición aguda, capacidad de nutrir silenciosamente.",
        "strengths":["Percepción","Adaptabilidad","Nutrición silenciosa","Intuición profunda"],
        "vulnerabilities":["Agotamiento por output","Invisibilidad","Sensibilidad excesiva"]},
}

TEN_GODS = {
    "friend":     {"cn":"比肩","name":"Friend (Bi Jian)",          "desc":"Compañero, identidad, confianza en sí mismo. Independencia y autoestima."},
    "rob":        {"cn":"劫财","name":"Rob Wealth (Jie Cai)",      "desc":"Competencia, generosidad excesiva, hermanos y rivales. Tendencia a compartir recursos."},
    "eating":     {"cn":"食神","name":"Eating God (Shi Shen)",     "desc":"Creatividad gentil, talentos artísticos, hijos, disfrute y abundancia."},
    "hurting":    {"cn":"伤官","name":"Hurting Officer (Shang Guan)","desc":"Creatividad disruptiva, rebeldía, innovación, brillantez que desafía convenciones."},
    "d_wealth":   {"cn":"正财","name":"Direct Wealth (Zheng Cai)", "desc":"Riqueza estable, salario regular, posesiones materiales, esposa (para hombres)."},
    "i_wealth":   {"cn":"偏财","name":"Indirect Wealth (Pian Cai)","desc":"Riqueza no convencional, padre, especulación, negocios y golpes de suerte."},
    "d_officer":  {"cn":"正官","name":"Direct Officer (Zheng Guan)","desc":"Autoridad, estructura, carrera estable, esposo (para mujeres), reputación."},
    "7_killings": {"cn":"七杀","name":"Seven Killings (Qi Sha)",   "desc":"Poder agresivo, presión transformadora, competencia intensa, mando militar."},
    "d_resource": {"cn":"正印","name":"Direct Resource (Zheng Yin)","desc":"Apoyo, educación formal, madre, nutrición emocional, sabiduría tradicional."},
    "i_resource": {"cn":"偏印","name":"Indirect Resource (Pian Yin)","desc":"Conocimiento no convencional, mentores, espiritualidad, habilidades únicas."},
}

ORGAN_MAP = {
    "Wood":  {"organs":"Hígado / Vesícula Biliar","emotion":"Ira, Frustración",
              "healing_sound":"SHHHHH","foods":["Verduras de hoja verde","Brócoli","Kiwi","Limón"],
              "color":"Verde","direction":"Este","season":"Primavera"},
    "Fire":  {"organs":"Corazón / Intestino Delgado","emotion":"Alegría, Ansiedad",
              "healing_sound":"HAAAAAW","foods":["Tomate","Pimiento rojo","Frutos rojos","Granada"],
              "color":"Rojo","direction":"Sur","season":"Verano"},
    "Earth": {"organs":"Bazo / Estómago","emotion":"Preocupación, Overthinking",
              "healing_sound":"HUUUUU","foods":["Camote","Zanahoria","Calabaza","Granos integrales"],
              "color":"Amarillo","direction":"Centro","season":"Cambio de estación"},
    "Metal": {"organs":"Pulmones / Intestino Grueso","emotion":"Duelo, Soltar",
              "healing_sound":"SSSSSSS","foods":["Rábano","Pera","Arroz blanco","Ajo","Jengibre"],
              "color":"Blanco / Plateado","direction":"Oeste","season":"Otoño"},
    "Water": {"organs":"Riñones / Vejiga","emotion":"Miedo, Sabiduría",
              "healing_sound":"CHUUUIII","foods":["Algas","Miso","Frijoles negros","Sésamo negro"],
              "color":"Negro / Azul oscuro","direction":"Norte","season":"Invierno"},
}
