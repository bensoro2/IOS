import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ThaiPrivacySections = [
  {
    title: "1. ข้อมูลที่แอปพลิเคชันเก็บรวบรวม",
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          แอปพลิเคชันเก็บรวบรวมข้อมูลจากผู้ใช้งานในหลายรูปแบบ เพื่อให้สามารถให้บริการได้อย่างมีประสิทธิภาพ:
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed pt-1">
          <strong className="text-foreground">ข้อมูลที่ผู้ใช้งานให้โดยตรง:</strong>
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 pl-2">
          <li>ชื่อที่แสดง (Display Name) และรูปโปรไฟล์</li>
          <li>อีเมลที่ใช้ลงทะเบียนหรือเข้าสู่ระบบ</li>
          <li>เบอร์โทรศัพท์ และวันเกิด (หากกรอก)</li>
          <li>ข้อมูล Bio และคำอธิบายตนเอง</li>
          <li>ข้อมูลกิจกรรม เช่น Check-in, Interest, การสร้างกิจกรรม</li>
          <li>เนื้อหา Reels (วิดีโอ, คำบรรยาย, หมวดหมู่)</li>
          <li>ข้อความในแชท (กลุ่มและส่วนตัว)</li>
          <li>ข้อมูลร้านค้าที่สร้างในระบบ Shop</li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed pt-1">
          <strong className="text-foreground">ข้อมูลที่เก็บโดยอัตโนมัติ:</strong>
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 pl-2">
          <li>IP Address และตำแหน่งโดยประมาณ</li>
          <li>ประเภทอุปกรณ์ ระบบปฏิบัติการ และเวอร์ชันเบราว์เซอร์</li>
          <li>ข้อมูลการใช้งาน เช่น หน้าที่เข้าชม ระยะเวลาการใช้งาน</li>
          <li>ข้อมูล Push Notification Token (FCM Token)</li>
        </ul>
      </>
    ),
  },
  {
    title: "2. วัตถุประสงค์การใช้ข้อมูล",
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          แอปพลิเคชันใช้ข้อมูลที่เก็บรวบรวมเพื่อวัตถุประสงค์ดังต่อไปนี้:
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 pl-2">
          <li><strong className="text-foreground">การให้บริการ:</strong> เพื่อให้ผู้ใช้งานสามารถใช้งานฟีเจอร์ต่างๆ เช่น Check-in, แชท, Reels, ร้านค้า และการจัดกิจกรรม</li>
          <li><strong className="text-foreground">การยืนยันตัวตน:</strong> เพื่อตรวจสอบและรักษาความปลอดภัยของบัญชีผู้ใช้งาน</li>
          <li><strong className="text-foreground">ระบบ Level/EXP:</strong> เพื่อคำนวณคะแนน EXP, ระดับ Level และจัดอันดับผู้ใช้งาน</li>
          <li><strong className="text-foreground">การแจ้งเตือน:</strong> เพื่อส่งการแจ้งเตือนเกี่ยวกับข้อความ กิจกรรม และการอัปเดตที่สำคัญ</li>
          <li><strong className="text-foreground">การปรับปรุงบริการ:</strong> เพื่อวิเคราะห์พฤติกรรมการใช้งานและพัฒนาประสบการณ์ของผู้ใช้งาน</li>
          <li><strong className="text-foreground">ความปลอดภัย:</strong> เพื่อตรวจจับและป้องกันการใช้งานที่ไม่เหมาะสม การฉ้อโกง หรือการละเมิดข้อกำหนด</li>
          <li><strong className="text-foreground">การปฏิบัติตามกฎหมาย:</strong> เพื่อปฏิบัติตามข้อกำหนดทางกฎหมายที่เกี่ยวข้อง</li>
        </ul>
      </>
    ),
  },
  {
    title: "3. การเปิดเผยข้อมูล",
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          แอปพลิเคชันอาจเปิดเผยข้อมูลของผู้ใช้งานในกรณีดังต่อไปนี้:
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 pl-2">
          <li><strong className="text-foreground">ผู้ให้บริการที่เกี่ยวข้อง:</strong> เช่น Supabase (ระบบฐานข้อมูลและ Authentication), Stripe (ระบบชำระเงิน), Firebase (ระบบแจ้งเตือน Push Notification)</li>
          <li><strong className="text-foreground">ข้อมูลสาธารณะ:</strong> ข้อมูลโปรไฟล์, กิจกรรม, Reels และร้านค้าที่ผู้ใช้งานตั้งค่าเป็นสาธารณะจะสามารถมองเห็นได้โดยผู้ใช้งานอื่น</li>
          <li><strong className="text-foreground">ตามกฎหมาย:</strong> เมื่อได้รับคำสั่งจากศาลหรือหน่วยงานราชการที่มีอำนาจ</li>
          <li><strong className="text-foreground">การปกป้องสิทธิ:</strong> เพื่อปกป้องสิทธิ ทรัพย์สิน หรือความปลอดภัยของ Levelon และผู้ใช้งาน</li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed pt-2 font-medium text-foreground">
          แอปพลิเคชันจะไม่ขายข้อมูลส่วนตัวของผู้ใช้งานให้แก่บุคคลที่สามเพื่อวัตถุประสงค์ทางการตลาดโดยเด็ดขาด
        </p>
      </>
    ),
  },
  {
    title: "4. การตั้งค่าความเป็นส่วนตัว",
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ผู้ใช้งานสามารถควบคุมความเป็นส่วนตัวของข้อมูลได้ผ่านการตั้งค่าในแอปพลิเคชัน:
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 pl-2">
          <li><strong className="text-foreground">กิจกรรม:</strong> เลือกให้กิจกรรมเป็นแบบสาธารณะ (ทุกคนเห็น) หรือส่วนตัว (ต้องขอเข้าร่วม)</li>
          <li><strong className="text-foreground">การบล็อก:</strong> บล็อกผู้ใช้งานที่ไม่ต้องการให้เห็นเนื้อหาหรือติดต่อได้</li>
          <li><strong className="text-foreground">การแจ้งเตือน:</strong> ปิด/เปิดการแจ้งเตือนสำหรับแชทกลุ่ม ข้อความส่วนตัว และกิจกรรมต่างๆ</li>
          <li><strong className="text-foreground">โปรไฟล์:</strong> แก้ไขข้อมูลส่วนตัวที่แสดงต่อสาธารณะ เช่น ชื่อ รูปโปรไฟล์ Bio</li>
          <li><strong className="text-foreground">การระงับบัญชี:</strong> ระงับบัญชีชั่วคราวเพื่อซ่อนโปรไฟล์และเนื้อหาทั้งหมดจากผู้ใช้งานอื่น</li>
        </ul>
      </>
    ),
  },
  {
    title: "5. สิทธิของผู้ใช้งาน",
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ภายใต้กฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) และกฎหมายที่เกี่ยวข้อง ผู้ใช้งานมีสิทธิดังต่อไปนี้:
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 pl-2">
          <li><strong className="text-foreground">สิทธิในการเข้าถึง:</strong> ขอดูข้อมูลส่วนตัวที่แอปพลิเคชันจัดเก็บไว้</li>
          <li><strong className="text-foreground">สิทธิในการแก้ไข:</strong> แก้ไขข้อมูลที่ไม่ถูกต้องหรือไม่เป็นปัจจุบันผ่านหน้าตั้งค่าโปรไฟล์</li>
          <li><strong className="text-foreground">สิทธิในการลบ:</strong> ขอให้ลบข้อมูลส่วนตัวและบัญชีผู้ใช้งานออกจากระบบ</li>
          <li><strong className="text-foreground">สิทธิในการคัดค้าน:</strong> คัดค้านการประมวลผลข้อมูลในบางกรณี</li>
          <li><strong className="text-foreground">สิทธิในการโอนย้าย:</strong> ขอรับข้อมูลส่วนตัวในรูปแบบที่สามารถอ่านได้</li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed pt-2">
          หากต้องการใช้สิทธิข้างต้น กรุณาติดต่อแอปพลิเคชันผ่านอีเมล <strong className="text-foreground">levelon.app@gmail.com</strong> หรือผ่านระบบ Support ในแอปพลิเคชัน แอปพลิเคชันจะดำเนินการภายใน 30 วันนับจากวันที่ได้รับคำร้อง
        </p>
      </>
    ),
  },
  {
    title: "6. ความปลอดภัย",
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          แอปพลิเคชันมุ่งมั่นในการปกป้องข้อมูลของผู้ใช้งานด้วยมาตรการรักษาความปลอดภัยที่เข้มงวด:
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 pl-2">
          <li><strong className="text-foreground">การเข้ารหัส:</strong> ข้อมูลทั้งหมดถูกเข้ารหัสระหว่างการส่งผ่าน (TLS/SSL) และจัดเก็บอย่างปลอดภัย</li>
          <li><strong className="text-foreground">การยืนยันตัวตน:</strong> ใช้ระบบ Authentication มาตรฐานสากล รองรับ Email/Password และ OAuth (Google)</li>
          <li><strong className="text-foreground">Row Level Security:</strong> ฐานข้อมูลใช้ระบบ RLS เพื่อให้ผู้ใช้งานเข้าถึงได้เฉพาะข้อมูลที่ได้รับอนุญาต</li>
          <li><strong className="text-foreground">การตรวจสอบเนื้อหา:</strong> มีระบบ Content Moderation เพื่อคัดกรองเนื้อหาที่ไม่เหมาะสม</li>
          <li><strong className="text-foreground">การรายงาน:</strong> ผู้ใช้งานสามารถรายงานเนื้อหาหรือบัญชีที่ละเมิดข้อกำหนดได้ทันที</li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed pt-2">
          แม้แอปพลิเคชันจะใช้มาตรการที่เหมาะสม แต่ไม่มีระบบใดปลอดภัย 100% ผู้ใช้งานควรรักษารหัสผ่านและไม่แชร์ข้อมูลการเข้าสู่ระบบกับผู้อื่น
        </p>
      </>
    ),
  },
  {
    title: "7. ความปลอดภัยของเด็ก",
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          แอปพลิเคชันมีนโยบายไม่ยอมรับเนื้อหาที่เกี่ยวข้องกับการล่วงละเมิดทางเพศเด็ก (CSAE — Child Sexual Abuse and Exploitation) หรือสื่อการล่วงละเมิดทางเพศเด็ก (CSAM — Child Sexual Abuse Material) ทุกรูปแบบอย่างเด็ดขาด ซึ่งรวมถึงแต่ไม่จำกัดเพียง:
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 pl-2">
          <li>เนื้อหาหรือพฤติกรรมที่แสวงหาประโยชน์ทางเพศจากเด็ก</li>
          <li>การล่อลวง ชักจูง หรือสร้างความสัมพันธ์ที่ไม่เหมาะสมกับผู้เยาว์ (Grooming)</li>
          <li>การค้าเด็กเพื่อวัตถุประสงค์ทางเพศ</li>
          <li>การเผยแพร่ จัดเก็บ หรือแบ่งปันสื่อที่มีเนื้อหาล่วงละเมิดเด็ก</li>
          <li>การบูลลี่ คุกคาม หรือข่มขู่เด็กและเยาวชน</li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed pt-1">
          <strong className="text-foreground">มาตรการของแอปพลิเคชัน:</strong>
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 pl-2">
          <li>ผู้ใช้งานสามารถรายงานเนื้อหาหรือพฤติกรรมที่ไม่เหมาะสมผ่านระบบรายงานในแอปพลิเคชัน หรือติดต่อโดยตรงที่อีเมล <strong className="text-foreground">levelon.app@gmail.com</strong></li>
          <li>เนื้อหาที่ละเมิดจะถูกลบออกทันทีเมื่อตรวจพบ และบัญชีผู้กระทำผิดจะถูกระงับถาวร</li>
          <li>แอปพลิเคชันจะรายงานกรณีที่เกี่ยวข้องไปยังหน่วยงานบังคับใช้กฎหมายและองค์กรที่เกี่ยวข้อง เช่น NCMEC (National Center for Missing & Exploited Children) ตามที่กฎหมายกำหนด</li>
          <li>ระบบมีการตรวจสอบเนื้อหา (Content Moderation) เพื่อป้องกันการเผยแพร่สื่อที่ไม่เหมาะสม</li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed pt-1">
          แอปพลิเคชันนี้ไม่อนุญาตให้ผู้ใช้งานที่มีอายุต่ำกว่า 13 ปีลงทะเบียนใช้งาน หากพบว่าผู้ใช้งานมีอายุต่ำกว่าเกณฑ์ บัญชีดังกล่าวจะถูกระงับทันที
        </p>
      </>
    ),
  },
  {
    title: "8. การเปลี่ยนแปลงนโยบาย",
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          แอปพลิเคชันอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นระยะเพื่อให้สอดคล้องกับการเปลี่ยนแปลงของบริการและกฎหมายที่เกี่ยวข้อง:
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 pl-2">
          <li>การเปลี่ยนแปลงจะมีผลทันทีเมื่อประกาศในแอปพลิเคชัน</li>
          <li>การเปลี่ยนแปลงที่สำคัญจะมีการแจ้งเตือนผู้ใช้งานผ่านแอปพลิเคชัน</li>
          <li>การใช้งานต่อหลังจากการเปลี่ยนแปลงถือว่าผู้ใช้งานยอมรับนโยบายฉบับปรับปรุงแล้ว</li>
          <li>ผู้ใช้งานสามารถตรวจสอบวันที่อัปเดตล่าสุดได้ที่ด้านบนของหน้านี้</li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed pt-2">
          หากผู้ใช้งานมีคำถามเกี่ยวกับนโยบายนี้ สามารถติดต่อแอปพลิเคชันได้ที่ <strong className="text-foreground">levelon.app@gmail.com</strong>
        </p>
      </>
    ),
  },
];

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const isThai = language === "th";

  const translatedSections = [
    { title: t("privacy.s1.title"), body: t("privacy.s1.body") },
    { title: t("privacy.s2.title"), body: t("privacy.s2.body") },
    { title: t("privacy.s3.title"), body: t("privacy.s3.body") },
    { title: t("privacy.s4.title"), body: t("privacy.s4.body") },
    { title: t("privacy.s5.title"), body: t("privacy.s5.body") },
    { title: t("privacy.s6.title"), body: t("privacy.s6.body") },
    { title: t("privacy.s7.title"), body: t("privacy.s7.body") },
    { title: t("privacy.s8.title"), body: t("privacy.s8.body") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center gap-4 px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">{t("privacy.pageTitle")}</h1>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto pb-8 space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-primary">{t("privacy.pageTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("privacy.updatedAt")}</p>
        </div>

        <div className="bg-card rounded-xl overflow-hidden divide-y divide-border">
          {isThai
            ? ThaiPrivacySections.map((section, i) => (
                <details key={i} className="group">
                  <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors list-none">
                    <span className="flex-1 font-semibold text-base text-primary">{section.title}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90 shrink-0" />
                  </summary>
                  <div className="px-4 py-3 bg-muted/30 space-y-1">
                    {section.content}
                  </div>
                </details>
              ))
            : translatedSections.map((section, i) => (
                <details key={i} className="group">
                  <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors list-none">
                    <span className="flex-1 font-semibold text-base text-primary">{section.title}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90 shrink-0" />
                  </summary>
                  <div className="px-4 py-3 bg-muted/30">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{section.body}</p>
                  </div>
                </details>
              ))}
        </div>

        <div className="text-center text-xs text-muted-foreground pt-4 pb-2 space-y-1">
          <p>{t("privacy.copyright")}</p>
          <p>{t("privacy.copyrightNote")}</p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
