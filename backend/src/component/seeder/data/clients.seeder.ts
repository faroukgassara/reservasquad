import { PrismaClient } from 'src/generated/prisma/client';

interface RawClientItem {
  name: string;
  phone: string | null;
  mobile: string | null; // mapped to cin in our DB
  email: string | null;
}

const RAW_CLIENTS: RawClientItem[] = [
  { name: 'Achraf Chefi', phone: null, mobile: '11203937', email: 'achrafcheffi55@gmail.com' },
  { name: 'Adam Ben Haj Selem', phone: '28849249', mobile: '11247513', email: 'adamhadil2322@gmail.com' },
  { name: 'Adli Bellili', phone: '23709424', mobile: null, email: 'adlibellili107@gmail.com' },
  { name: 'Ahlem Lahyeni', phone: '99989286', mobile: '11062022', email: 'lahyaniahlem07@gmail.com' },
  { name: 'Ahlem Louati', phone: '54384328', mobile: null, email: null },
  { name: 'Ahmed Bahloul', phone: '92743749', mobile: '11108081', email: null },
  { name: 'Ahmed Derbel', phone: '55091098', mobile: '11226639', email: 'derbelahmed011@gmail.com' },
  { name: 'Ahmed Enaceur', phone: '27704159', mobile: '11113904', email: 'naserahmed.contact@gmail.com' },
  { name: 'Ahmed Kouba', phone: '23901780', mobile: '11217849', email: null },
  { name: 'Ahmed Kriaa', phone: '28994829', mobile: '11195318', email: null },
  { name: 'Ahmed Smaoui', phone: '21312990', mobile: '11222093', email: 'ahmedsmaoui016@gmail.com' },
  { name: 'Aicha Kammoun', phone: '98416077', mobile: '11235728', email: null },
  { name: 'Ala Ben Ayed', phone: '20902935', mobile: '11109929', email: 'benayedala998@gmail.com' },
  { name: 'Ali Msaed', phone: '52010003', mobile: null, email: 'alimsaed764@gmail.com' },
  { name: 'amal', phone: null, mobile: null, email: null },
  { name: 'Amal Kossentini', phone: '51555587', mobile: '11234812', email: 'kossentiniAmal@gmail.com' },
  { name: 'Amal Mtibaa', phone: '27091904', mobile: '11221791', email: 'amalmtibaa09@gmail.com' },
  { name: 'Amin Kammoun', phone: '98185377', mobile: '11939844', email: null },
  { name: 'Amina Ben Jmeaa', phone: '94 201 874', mobile: '11231946', email: 'aminabenjmeaa08@icloud.com' },
  { name: 'Amina Derbel', phone: '54724696', mobile: '11226635', email: 'aminaderbel123@gmail.com' },
  { name: 'Amine Ben Messaoud', phone: '28870030', mobile: null, email: 'amine.bmsd@gmail.com' },
  { name: 'Amine Triki', phone: '24844308', mobile: '11164281', email: 'aminetriki@gmail.com' },
  { name: 'Amira belhassen', phone: '28262100', mobile: '11244914', email: null },
  { name: 'Anas Besbes', phone: '23979272', mobile: null, email: 'anasbesbes8@gmail.com' },
  { name: 'ASSOCIA MED', phone: null, mobile: null, email: null },
  { name: 'Aydi Mouayed', phone: '92 480 919', mobile: '11237055', email: 'tornado123ggpolice@gmail.com' },
  { name: 'Ayoub Ghorbel', phone: '58237126', mobile: null, email: 'ayoubghorbel111@gmail.com' },
  { name: 'Aziz Neji', phone: '58 341 411', mobile: '11215897', email: 'nejimedaziz58@gmail.com' },
  { name: 'baya', phone: null, mobile: null, email: 'baya@bibliosquad.com' },
  { name: 'Becem Briki', phone: '21532184', mobile: '11142591', email: 'bessembriki91@gmail.com' },
  { name: 'BIBLIO SQUAD', phone: '96830217', mobile: '44561686', email: 'contact@bibliosquad.com' },
  { name: 'CDS', phone: null, mobile: null, email: null },
  { name: 'Chourouk Bouzguenda', phone: '56826863', mobile: null, email: null },
  { name: 'Donia Jemni', phone: '23788021', mobile: '11216936', email: 'doniajemni20@gmail.com' },
  { name: 'Edam Abouda', phone: '58 417 111', mobile: '11241361', email: 'edamabouda59@gmail.com' },
  { name: 'Edam neji', phone: '24804204', mobile: '11201851', email: 'edamneji8@gmail.com' },
  { name: 'Emna Chaari', phone: '24771322', mobile: null, email: 'chaariemna00@icloud.com' },
  { name: 'Emna Jerbi', phone: '93329012', mobile: null, email: null },
  { name: 'Emna Khrifeche', phone: '94256886', mobile: null, email: 'khrifeche@gmail.com' },
  { name: 'Emna Masmoudi', phone: '21 077 321 ', mobile: null, email: 'masmoudiemna@gmail.com' },
  { name: 'Emna Zouch', phone: '25160089 / 24380728', mobile: '11207799', email: 'emnazouch186@gmail.com' },
  { name: 'Eya Abidi', phone: '24 934 558', mobile: null, email: 'ayaabidi934567@gmail.com' },
  { name: 'Eya Abouda', phone: '58 417 113', mobile: '11241362', email: 'eyaabouda63@gmail.com' },
  { name: 'Eya Boudawara', phone: '50410436', mobile: null, email: 'eyaboudawara03@gmail.com' },
  { name: 'Eya Chermiti', phone: '95437022', mobile: null, email: 'eyachermiti03@gmail.com' },
  { name: 'Eya Htiouch', phone: '24269122', mobile: '11232612', email: 'ayoutahht20@gmail.com' },
  { name: 'Farah Khribi', phone: '58 675 284', mobile: null, email: 'jamilags35@gmail.com' },
  { name: 'Farah Trabelsi', phone: null, mobile: '11196607', email: 'farahtrabelsi49@gmail.com' },
  { name: 'farouk', phone: null, mobile: null, email: 'farouk@bibliosquad.com' },
  { name: 'FATMA', phone: null, mobile: null, email: null },
  { name: 'Fatma Daoud', phone: '58116653', mobile: null, email: 'fatmadaoud@gmail.com' },
  { name: 'Firas Hdidar', phone: '94360110', mobile: null, email: 'halimabenchikha55@gmail.com' },
  { name: 'Grati Ahmed', phone: '22255185', mobile: '11225785', email: 'ahmedgrati001@gmail.com' },
  { name: 'Habib Dridi', phone: '28745609', mobile: null, email: 'habibdridi2909@gmail.com' },
  { name: 'Hadil Hadj Taieb', phone: '27096796', mobile: '11246151', email: 'hadilhjt1@gmail.com' },
  { name: 'Hbiba Daoud', phone: '24905460', mobile: null, email: 'habibadaoud76@gmail.com' },
  { name: 'Hiba Chekir', phone: '93 621 081', mobile: '11221131', email: 'houbachekir123@gmail.com' },
  { name: 'Jamila Gassara', phone: '92 660 440', mobile: null, email: 'jamilags35@gmail.com' },
  { name: 'Khadija Baklouti', phone: '28 551 667', mobile: null, email: 'bakloutikhadija48@gmail.com' },
  { name: 'Koulthoum Neili', phone: '25112679', mobile: '11050649', email: 'neilikoulthoum@gmail.com' },
  { name: 'Mahdi Bellassoued', phone: '26831320', mobile: '11222744', email: 'mahdibellassoued456@gmail.com' },
  { name: 'Mahmoud Charfi', phone: '50195484', mobile: '11222494', email: 'mahmoudcharfi19@gmail.com' },
  { name: 'Malek Gharbi', phone: '20039381', mobile: null, email: 'gharbimalek55@gmail.com' },
  { name: 'Manar Chakroun', phone: '52242968', mobile: '11140300', email: 'manarchakroun19@gmail.com' },
  { name: 'Mariam chtioui', phone: '24295489', mobile: null, email: 'mariemchtioui123@gmail.com' },
  { name: 'Mariem Kobbi', phone: '50402580', mobile: '11218418', email: 'mariemkobbi54@gmail.com' },
  { name: 'Mariem Naifar', phone: '56677819', mobile: '11204457', email: 'naifarmariem00@gmail.com' },
  { name: 'Med Amine Bouhamed', phone: '25511608', mobile: null, email: 'mohamedbouhames@gmail.com' },
  { name: 'Melek Ben Chikha', phone: '53413394', mobile: '11209349', email: 'melekbenchikha@gmail.com' },
  { name: 'Moemen Baklouti', phone: '44109913', mobile: '11214733', email: 'moemenbaklouti166@gmail.com' },
  { name: 'Mohamed Aziz Ghram', phone: '28403775', mobile: '11242001', email: 'ghramaziz75@gmail.com' },
  // Deduplicated: Keep the row with phone and latest email
  { name: 'Mohamed Aziz Riahi', phone: '92186926', mobile: '11171891', email: 'azizriahi369@gmail.com' },
  { name: 'Mohamed Njah', phone: '58757783', mobile: '11142718', email: 'njehmed7@gmail.com' },
  { name: 'Mohammed Masmoudi', phone: '57127502', mobile: null, email: 'masmoudi.mohamed01@icloud.com' },
  { name: 'Molka Trabelsi', phone: '58186136', mobile: '11094436', email: 'molka.trabelsi.97@gmail.com' },
  { name: 'Nesrine Bahloul', phone: '28265896', mobile: '08890800', email: 'dr.bahloul.nesrine@gmail.com' },
  // Deduplicated: Keep the row with phone and CIN
  { name: 'Nour Houda Masmoudi', phone: '53 914 463', mobile: '11212045', email: null },
  { name: 'Nourhen Tahri', phone: '93744211', mobile: '11177684', email: null },
  { name: 'Omar Mnejja', phone: '50433343', mobile: '11183048', email: 'omar.mnejja03@gmail.com' },
  { name: 'Rahma Ayedi', phone: '21083042', mobile: null, email: null },
  { name: 'Rahma Dhouib', phone: '21977744', mobile: '11069568', email: null },
  { name: 'Rahma Khribi', phone: '28442793', mobile: '11221066', email: 'rahmakhribi749@gmail.com' },
  { name: 'Ranim Masmoudi', phone: '25533378', mobile: '11231779', email: 'masmoudiranim@gmail.com' },
  { name: 'Rayen Behi', phone: '54123320', mobile: '11245650', email: 'rayenbehi9@gmail.com' },
  { name: 'Rayen Trabelsi', phone: '92521333', mobile: '11226802', email: 'rayentrabelsi1234@gmail.com' },
  { name: 'Sabrine Ghorbel', phone: '28240227', mobile: null, email: 'sabrineghorbel@gmail.com' },
  { name: 'Safa Grati', phone: '27823002', mobile: null, email: 'safa.grati20@gmail.com' },
  { name: 'Saif Jarboui', phone: '50596062', mobile: null, email: 'saifjarboui2025@gmail.com' },
  { name: 'Saoussan Aydi', phone: '54458685', mobile: '05378156', email: 'aidi-nis@yahoo.fr' },
  { name: 'Sirine Ben Romdhane', phone: '23 535 245', mobile: '11194032', email: 'sirinebenromdhane41@gmail.com' },
  { name: 'Slim lahyani', phone: '28665718', mobile: null, email: null },
  { name: 'Sofien Abdallah', phone: '27 077 199', mobile: '11216781', email: 'soufienabdallah200@gmail.com' },
  { name: 'Sorimex', phone: null, mobile: null, email: null },
  { name: 'souhir', phone: null, mobile: null, email: 'souhir@bibliosquad.com' },
  { name: 'staff', phone: null, mobile: null, email: 'staff@bibliosquad.com' },
  { name: 'STE MOBILE STATION SALES', phone: null, mobile: null, email: null },
  { name: 'Taha Derbel', phone: '52515162', mobile: '11216219', email: 'derbeltaha060@gmail.com' },
  { name: 'Trabelsi Malek', phone: '29579208', mobile: '11235774', email: 'malektrabelsi620@gmail.com' },
  { name: 'Wejden Badri', phone: '56100235', mobile: '11167700', email: 'badriwejden10@gmail.com' },
  { name: 'Yasmine Mtibaa', phone: '99426721', mobile: null, email: 'yasminemtibaa@gmail.com' },
  { name: 'Yassine Kssentini', phone: '29664667', mobile: null, email: 'yassinekssentin@gmail.com' },
  { name: 'Yassmine Masmoudi', phone: '53914423', mobile: '11169384', email: null },
  { name: 'Yesmine Gdoura', phone: '98511447', mobile: '11225342', email: 'gdourayesmine3@gmail.com' },
  { name: 'Yessin Weda', phone: '95907405', mobile: '11239681', email: 'wedayessin@gmail.com' },
  { name: 'Yessine Mesfar', phone: '98278041', mobile: '11234395', email: 'yessinemesfar3@gmail.com' },
  { name: 'Yosr Abid', phone: '27026719', mobile: '11237434', email: 'abidyosr4@gmail.com' },
  { name: 'Yosri Hassairi', phone: '92279624', mobile: '11111084', email: 'hassairiyosri11@gmail.com' },
  { name: 'Youssef Dammak', phone: '2906434', mobile: null, email: 'shacosall33@gmail.com' },
  { name: 'Youssef Jardak', phone: '99 855 110', mobile: '11245052', email: 'youssefjardak6@gmail.com' },
  { name: 'Youssef Ouarda', phone: '94 088 420', mobile: '11238489', email: 'youssefwerda06@gmail.com' },
  { name: 'Zaineb Chtourou', phone: '94195193', mobile: '11237379', email: 'zainebchtourou2020@gmail.com' },
  { name: 'Zaineb Sefi', phone: '28218752', mobile: '11238469', email: 'sefizaineb95@gmail.com' },
  { name: 'Zayd Zouari', phone: '98750244', mobile: null, email: 'zaidzouari@gmail.com' },
  { name: 'Zayneb Ben Makhlouf', phone: '55178308', mobile: '11231855', email: 'zaynebbenmakhlouf@gmail.com' },
  { name: 'Zayneb Turki', phone: '22 100 096', mobile: '11235622', email: 'zeinbtk@gmail.com' },
];

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function cleanPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // If multiple phone numbers are separated by slash, format cleanly or keep first clean number
  return trimmed.replaceAll(/\s+/g, '');
}

function cleanCin(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replaceAll(/\s+/g, '').trim();
  return cleaned || null;
}

export const seedClients = async (prisma: PrismaClient) => {
  console.log(`--- Seeding ${RAW_CLIENTS.length} Credit Clients ---`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of RAW_CLIENTS) {
    const { firstName, lastName } = splitName(item.name);
    const phone = cleanPhone(item.phone);
    const cin = cleanCin(item.mobile);
    const email = item.email?.trim() || null;

    // Check if client exists by CIN (if provided) or by firstName + lastName
    let existing = null;
    if (cin) {
      existing = await prisma.creditClient.findFirst({
        where: { cin, deletedAt: null },
      });
    }

    if (!existing) {
      existing = await prisma.creditClient.findFirst({
        where: {
          firstName,
          lastName,
          deletedAt: null,
        },
      });
    }

    if (existing) {
      await prisma.creditClient.update({
        where: { id: existing.id },
        data: {
          phone: phone ?? existing.phone,
          cin: cin ?? existing.cin,
          email: email ?? existing.email,
        },
      });
      updatedCount++;
    } else {
      await prisma.creditClient.create({
        data: {
          firstName,
          lastName,
          phone,
          cin,
          email,
        },
      });
      createdCount++;
    }
  }

  console.log(`Successfully processed clients: ${createdCount} created, ${updatedCount} updated.`);
};
