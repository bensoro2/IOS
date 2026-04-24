import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  hasNativeTranslation,
  loadCachedTranslations,
  saveCachedTranslations,
  translateAllStrings,
} from "@/utils/dynamicTranslation";

export type Language = string;

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isTranslating: boolean;
  translateProgress: number;
};

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

const translations: Record<string, Record<string, string>> = {
  // Header
  "settings.title": { th: "ตั้งค่า", en: "Settings", ja: "設定", zh: "设置", ko: "설정", ru: "Настройки" },

  // Account section
  "settings.account": { th: "บัญชี", en: "Account", ja: "アカウント", zh: "账户", ko: "계정", ru: "Аккаунт" },
  "settings.editProfile": { th: "แก้ไขโปรไฟล์", en: "Edit Profile", ja: "プロフィール編集", zh: "编辑个人资料", ko: "프로필 편집", ru: "Редактировать профиль" },
  "settings.privacySecurity": { th: "ความเป็นส่วนตัวและความปลอดภัย", en: "Privacy & Security", ja: "プライバシーとセキュリティ", zh: "隐私与安全", ko: "개인정보 및 보안", ru: "Конфиденциальность и безопасность" },

  // Settings section
  "settings.settings": { th: "การตั้งค่า", en: "Settings", ja: "設定", zh: "设置", ko: "설정", ru: "Настройки" },
  "settings.notifications": { th: "การแจ้งเตือน", en: "Notifications", ja: "通知", zh: "通知", ko: "알림", ru: "Уведомления" },
  "settings.pushBlocked": { th: "Push ถูกบล็อกโดยเบราว์เซอร์ กรุณาเปิดในตั้งค่าเบราว์เซอร์", en: "Push blocked by browser. Please enable in browser settings.", ja: "プッシュ通知がブラウザでブロックされています。ブラウザ設定で有効にしてください。", zh: "推送通知被浏览器阻止，请在浏览器设置中启用。", ko: "브라우저에서 푸시가 차단되었습니다. 브라우저 설정에서 활성화하세요.", ru: "Push заблокирован браузером. Включите в настройках браузера." },
  "settings.notifOn": { th: "เปิดการแจ้งเตือนแล้ว", en: "Notifications enabled", ja: "通知をオンにしました", zh: "已开启通知", ko: "알림이 활성화되었습니다", ru: "Уведомления включены" },
  "settings.notifOff": { th: "ปิดการแจ้งเตือนแล้ว", en: "Notifications disabled", ja: "通知をオフにしました", zh: "已关闭通知", ko: "알림이 비활성화되었습니다", ru: "Уведомления отключены" },
  "settings.language": { th: "ภาษา", en: "Language", ja: "言語", zh: "语言", ko: "언어", ru: "Язык" },
  "settings.country": { th: "ประเทศ", en: "Country", ja: "国", zh: "国家", ko: "국가", ru: "Страна" },

  // Subscription
  "settings.subscription": { th: "สมัครสมาชิก", en: "Subscription", ja: "サブスクリプション", zh: "订阅", ko: "구독", ru: "Подписка" },

  // Promo code
  "settings.promoCode": { th: "โค้ดสิทธิพิเศษ", en: "Promo Code", ja: "プロモコード", zh: "优惠码", ko: "프로모 코드", ru: "Промокод" },
  "settings.checkPlusPoints": { th: "แต้ม Check Plus", en: "Check Plus Points", ja: "Check Plus ポイント", zh: "Check Plus 积分", ko: "Check Plus 포인트", ru: "Баллы Check Plus" },
  "settings.redeemCode": { th: "ใส่โค้ด", en: "Redeem", ja: "引き換え", zh: "兑换", ko: "사용", ru: "Активировать" },
  "settings.yourCode": { th: "โค้ดของคุณ:", en: "Your code:", ja: "あなたのコード:", zh: "你的代码:", ko: "내 코드:", ru: "Ваш код:" },

  // Blocked users
  "settings.blockedUsers": { th: "ผู้ใช้ที่บล็อก", en: "Blocked Users", ja: "ブロックしたユーザー", zh: "已屏蔽用户", ko: "차단된 사용자", ru: "Заблокированные" },

  // Suspend
  "settings.suspendAccount": { th: "ระงับบัญชี", en: "Suspend Account", ja: "アカウント停止", zh: "暂停账户", ko: "계정 정지", ru: "Приостановить аккаунт" },
  "settings.suspendConfirmTitle": { th: "ยืนยันการระงับบัญชี", en: "Confirm Account Suspension", ja: "アカウント停止の確認", zh: "确认暂停账户", ko: "계정 정지 확인", ru: "Подтвердите приостановку" },
  "settings.suspendConfirmDesc": {
    th: "คุณแน่ใจหรือไม่ว่าต้องการระงับบัญชี? บัญชีของคุณจะถูกระงับการใช้งานและคุณจะถูกออกจากระบบทันที หากต้องการใช้งานอีกครั้ง กรุณาติดต่อทีมงาน",
    en: "Are you sure you want to suspend your account? You will be logged out immediately. Contact support to reactivate.",
    ja: "アカウントを停止してもよろしいですか？すぐにログアウトされます。再開するにはサポートにお問い合わせください。",
    zh: "确定要暂停账户吗？您将立即退出登录。如需重新激活，请联系客服。",
    ko: "계정을 정지하시겠습니까? 즉시 로그아웃됩니다. 재활성화하려면 고객센터에 문의하세요.",
    ru: "Вы уверены, что хотите приостановить аккаунт? Вы будете немедленно разлогинены. Для восстановления обратитесь в поддержку.",
  },
  "settings.suspendCancel": { th: "ยกเลิก", en: "Cancel", ja: "キャンセル", zh: "取消", ko: "취소", ru: "Отмена" },
  "settings.suspendConfirm": { th: "ยืนยันระงับบัญชี", en: "Confirm Suspension", ja: "停止を確認", zh: "确认暂停", ko: "정지 확인", ru: "Подтвердить" },

  // Delete Account
  "settings.deleteAccount": { th: "ลบบัญชี", en: "Delete Account", ja: "アカウント削除", zh: "删除账户", ko: "계정 삭제", ru: "Удалить аккаунт" },
  "settings.deleteConfirmTitle": { th: "ลบบัญชีถาวร?", en: "Delete Account Permanently?", ja: "アカウントを完全に削除しますか？", zh: "永久删除账户？", ko: "계정을 영구 삭제할까요?", ru: "Удалить аккаунт навсегда?" },
  "settings.deleteConfirmDesc": {
    th: "การลบบัญชีจะลบข้อมูลทั้งหมดของคุณออกอย่างถาวร รวมถึงโปรไฟล์ ข้อความ รีล และการตั้งค่าทั้งหมด ไม่สามารถกู้คืนได้",
    en: "This will permanently delete your account and all associated data including your profile, messages, reels, and settings. This action cannot be undone.",
    ja: "アカウントとすべての関連データ（プロフィール、メッセージ、リール、設定）を完全に削除します。この操作は元に戻せません。",
    zh: "这将永久删除您的账户及所有相关数据，包括个人资料、消息、短视频和设置。此操作无法撤销。",
    ko: "계정과 프로필, 메시지, 릴, 설정 등 모든 관련 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.",
    ru: "Это действие удалит ваш аккаунт и все связанные данные, включая профиль, сообщения, рилы и настройки. Отменить действие невозможно.",
  },
  "settings.deleteConfirm": { th: "ลบบัญชีถาวร", en: "Delete Permanently", ja: "完全に削除", zh: "永久删除", ko: "영구 삭제", ru: "Удалить навсегда" },
  "settings.deleteCancel": { th: "ยกเลิก", en: "Cancel", ja: "キャンセル", zh: "取消", ko: "취소", ru: "Отмена" },
  "toast.accountDeleted": { th: "ลบบัญชีสำเร็จ", en: "Account deleted successfully", ja: "アカウントを削除しました", zh: "账户已成功删除", ko: "계정이 삭제되었습니다", ru: "Аккаунт успешно удалён" },
  "toast.deleteError": { th: "เกิดข้อผิดพลาดในการลบบัญชี", en: "Error deleting account", ja: "アカウント削除エラー", zh: "删除账户时出错", ko: "계정 삭제 오류", ru: "Ошибка удаления аккаунта" },

  // Logout
  "settings.logout": { th: "ออกจากระบบ", en: "Log Out", ja: "ログアウト", zh: "退出登录", ko: "로그아웃", ru: "Выйти" },

  // Privacy Security page
  "privacySecurity.title": { th: "ความเป็นส่วนตัวและความปลอดภัย", en: "Privacy & Security", ja: "プライバシーとセキュリティ", zh: "隐私与安全", ko: "개인정보 및 보안", ru: "Конфиденциальность и безопасность" },
  "privacySecurity.helpCenter": { th: "ศูนย์ช่วยเหลือ", en: "Help Center", ja: "ヘルプセンター", zh: "帮助中心", ko: "고객센터", ru: "Центр помощи" },
  "privacySecurity.privacyPolicy": { th: "นโยบายความเป็นส่วนตัว", en: "Privacy Policy", ja: "プライバシーポリシー", zh: "隐私政策", ko: "개인정보 처리방침", ru: "Политика конфиденциальности" },
  "privacySecurity.terms": { th: "ข้อตกลงและเงื่อนไขการใช้งาน", en: "Terms of Service", ja: "利用規約", zh: "服务条款", ko: "이용약관", ru: "Условия использования" },
  "privacySecurity.changePassword": { th: "เปลี่ยนรหัสผ่าน", en: "Change Password", ja: "パスワード変更", zh: "修改密码", ko: "비밀번호 변경", ru: "Сменить пароль" },

  // Toasts
  "toast.paymentSuccess": { th: "ชำระเงินสำเร็จ! Premium ถูกเปิดใช้งานแล้ว", en: "Payment successful! Premium activated.", ja: "支払い成功！Premiumが有効になりました。", zh: "支付成功！Premium 已激活。", ko: "결제 성공! Premium이 활성화되었습니다.", ru: "Оплата прошла! Premium активирован." },
  "toast.paymentFail": { th: "การชำระเงินยังไม่สำเร็จ", en: "Payment not yet completed", ja: "支払いが完了していません", zh: "支付尚未完成", ko: "결제가 아직 완료되지 않았습니다", ru: "Оплата ещё не завершена" },
  "toast.paymentError": { th: "เกิดข้อผิดพลาดในการตรวจสอบการชำระเงิน", en: "Error verifying payment", ja: "支払い確認エラー", zh: "验证支付时出错", ko: "결제 확인 오류", ru: "Ошибка проверки оплаты" },
  "toast.subscriptionSuccess": { th: "สมัครสมาชิกสำเร็จ!", en: "Subscription successful!", ja: "サブスクリプション登録成功！", zh: "订阅成功！", ko: "구독 성공!", ru: "Подписка оформлена!" },
  "toast.paymentCancelled": { th: "ยกเลิกการชำระเงิน", en: "Payment cancelled", ja: "支払いがキャンセルされました", zh: "支付已取消", ko: "결제가 취소되었습니다", ru: "Оплата отменена" },
  "toast.enterCode": { th: "กรุณากรอกโค้ดสิทธิพิเศษ", en: "Please enter a promo code", ja: "プロモコードを入力してください", zh: "请输入优惠码", ko: "프로모 코드를 입력하세요", ru: "Введите промокод" },
  "toast.loginFirst": { th: "กรุณาเข้าสู่ระบบก่อน", en: "Please log in first", ja: "先にログインしてください", zh: "请先登录", ko: "먼저 로그인하세요", ru: "Сначала войдите в аккаунт" },
  "toast.selfRedeem": { th: "ไม่สามารถใช้โค้ดของตัวเองได้", en: "Cannot use your own code", ja: "自分のコードは使用できません", zh: "不能使用自己的代码", ko: "자신의 코드는 사용할 수 없습니다", ru: "Нельзя использовать свой код" },
  "toast.alreadyRedeemed": { th: "คุณเคยใช้โค้ดนี้ไปแล้ว", en: "You've already redeemed this code", ja: "このコードは既に使用済みです", zh: "您已经使用过此代码", ko: "이미 사용한 코드입니다", ru: "Вы уже использовали этот код" },
  "toast.codeSent": { th: "ส่งแต้ม +1 ให้เจ้าของโค้ดแล้ว!", en: "+1 point sent to code owner!", ja: "コード所有者に+1ポイント送信！", zh: "已向代码所有者发送+1积分！", ko: "코드 소유자에게 +1 포인트 전송!", ru: "+1 балл отправлен владельцу кода!" },
  "toast.codeMaxUses": { th: "โค้ดนี้ถูกใช้งานครบตามจำนวนแล้ว", en: "Code has reached max uses", ja: "このコードは使用上限に達しました", zh: "此代码已达到最大使用次数", ko: "코드 사용 횟수가 초과되었습니다", ru: "Код достиг лимита использований" },
  "toast.codeUsed": { th: "คุณได้ใช้โค้ดนี้ไปแล้ว", en: "You've already used this code", ja: "このコードは既に使用済みです", zh: "您已经使用过此代码", ko: "이미 사용한 코드입니다", ru: "Вы уже использовали этот код" },
  "toast.codeInvalid": { th: "โค้ดไม่ถูกต้องหรือหมดอายุแล้ว", en: "Invalid or expired code", ja: "無効または期限切れのコードです", zh: "代码无效或已过期", ko: "유효하지 않거나 만료된 코드입니다", ru: "Недействительный или просроченный код" },
  "toast.codeError": { th: "เกิดข้อผิดพลาดในการใช้โค้ด", en: "Error redeeming code", ja: "コードの引き換えエラー", zh: "兑换代码时出错", ko: "코드 사용 오류", ru: "Ошибка активации кода" },
  "toast.accountSuspended": { th: "บัญชีของคุณถูกระงับแล้ว", en: "Your account has been suspended", ja: "アカウントが停止されました", zh: "您的账户已暂停", ko: "계정이 정지되었습니다", ru: "Ваш аккаунт приостановлен" },
  "toast.suspendError": { th: "เกิดข้อผิดพลาดในการระงับบัญชี", en: "Error suspending account", ja: "アカウント停止エラー", zh: "暂停账户时出错", ko: "계정 정지 오류", ru: "Ошибка приостановки аккаунта" },
  "toast.checkPlusRedeemSuccess": { th: "🎉 ใช้โค้ดสำเร็จ! ได้รับ Check Plus +5 แต้ม", en: "🎉 Code redeemed! +5 Check Plus points added", ja: "🎉 コード使用成功！Check Plus +5ポイント獲得", zh: "🎉 兑换成功！获得 Check Plus +5 积分", ko: "🎉 코드 사용 성공! Check Plus +5 포인트 획득", ru: "🎉 Код активирован! +5 баллов Check Plus" },
  "toast.premiumRedeemSuccess": { th: "🎉 ใช้โค้ดสำเร็จ! ได้รับ {plan} {days} วัน", en: "🎉 Code redeemed! {plan} for {days} days", ja: "🎉 コード使用成功！{plan} {days}日間", zh: "🎉 兑换成功！获得 {plan} {days} 天", ko: "🎉 코드 사용 성공! {plan} {days}일", ru: "🎉 Код активирован! {plan} на {days} дней" },

  // Change Password page
  "changePassword.title": { th: "เปลี่ยนรหัสผ่าน", en: "Change Password", ja: "パスワード変更", zh: "修改密码", ko: "비밀번호 변경", ru: "Сменить пароль" },
  "changePassword.currentPassword": { th: "รหัสผ่านเก่า", en: "Current Password", ja: "現在のパスワード", zh: "当前密码", ko: "현재 비밀번호", ru: "Текущий пароль" },
  "changePassword.currentPasswordPlaceholder": { th: "กรอกรหัสผ่านปัจจุบัน", en: "Enter current password", ja: "現在のパスワードを入力", zh: "输入当前密码", ko: "현재 비밀번호 입력", ru: "Введите текущий пароль" },
  "changePassword.newPassword": { th: "รหัสผ่านใหม่", en: "New Password", ja: "新しいパスワード", zh: "新密码", ko: "새 비밀번호", ru: "Новый пароль" },
  "changePassword.newPasswordPlaceholder": { th: "อย่างน้อย 6 ตัวอักษร", en: "At least 6 characters", ja: "6文字以上", zh: "至少6个字符", ko: "최소 6자", ru: "Минимум 6 символов" },
  "changePassword.confirmPassword": { th: "ยืนยันรหัสผ่านใหม่", en: "Confirm New Password", ja: "新しいパスワードを確認", zh: "确认新密码", ko: "새 비밀번호 확인", ru: "Подтвердите пароль" },
  "changePassword.confirmPasswordPlaceholder": { th: "กรอกรหัสผ่านอีกครั้ง", en: "Re-enter new password", ja: "新しいパスワードを再入力", zh: "再次输入新密码", ko: "새 비밀번호 재입력", ru: "Повторите пароль" },
  "changePassword.submit": { th: "เปลี่ยนรหัสผ่าน", en: "Change Password", ja: "パスワードを変更", zh: "修改密码", ko: "비밀번호 변경", ru: "Сменить пароль" },
  "changePassword.loading": { th: "กำลังเปลี่ยนรหัสผ่าน...", en: "Changing password...", ja: "パスワード変更中...", zh: "正在修改密码...", ko: "비밀번호 변경 중...", ru: "Смена пароля..." },
  "changePassword.mismatch": { th: "รหัสผ่านไม่ตรงกัน", en: "Passwords don't match", ja: "パスワードが一致しません", zh: "密码不匹配", ko: "비밀번호가 일치하지 않습니다", ru: "Пароли не совпадают" },
  "changePassword.mismatchDesc": { th: "กรุณากรอกรหัสผ่านให้ตรงกันทั้งสองช่อง", en: "Please make sure both passwords match", ja: "両方のパスワードが一致するようにしてください", zh: "请确保两次输入的密码相同", ko: "두 비밀번호가 일치하도록 입력해주세요", ru: "Убедитесь, что оба пароля совпадают" },
  "changePassword.tooShort": { th: "รหัสผ่านสั้นเกินไป", en: "Password too short", ja: "パスワードが短すぎます", zh: "密码太短", ko: "비밀번호가 너무 짧습니다", ru: "Пароль слишком короткий" },
  "changePassword.tooShortDesc": { th: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร", en: "Password must be at least 6 characters", ja: "パスワードは6文字以上必要です", zh: "密码必须至少6个字符", ko: "비밀번호는 최소 6자 이상이어야 합니다", ru: "Пароль должен содержать не менее 6 символов" },
  "changePassword.noUser": { th: "ไม่พบข้อมูลผู้ใช้", en: "User not found", ja: "ユーザーが見つかりません", zh: "未找到用户", ko: "사용자를 찾을 수 없습니다", ru: "Пользователь не найден" },
  "changePassword.wrongCurrent": { th: "รหัสผ่านเก่าไม่ถูกต้อง", en: "Current password is incorrect", ja: "現在のパスワードが正しくありません", zh: "当前密码不正确", ko: "현재 비밀번호가 올바르지 않습니다", ru: "Текущий пароль неверен" },
  "changePassword.wrongCurrentDesc": { th: "กรุณากรอกรหัสผ่านปัจจุบันให้ถูกต้อง", en: "Please enter your current password correctly", ja: "現在のパスワードを正しく入力してください", zh: "请正确输入当前密码", ko: "현재 비밀번호를 올바르게 입력해주세요", ru: "Пожалуйста, введите правильный текущий пароль" },
  "changePassword.success": { th: "เปลี่ยนรหัสผ่านสำเร็จ", en: "Password changed", ja: "パスワードを変更しました", zh: "密码已修改", ko: "비밀번호가 변경되었습니다", ru: "Пароль изменён" },
  "changePassword.successDesc": { th: "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว", en: "Your password has been successfully changed", ja: "パスワードが正常に変更されました", zh: "您的密码已成功修改", ko: "비밀번호가 성공적으로 변경되었습니다", ru: "Ваш пароль успешно изменён" },

  // Index / Home page
  "home.nearbyActivities": { th: "กิจกรรมใกล้เคียง", en: "Nearby Activities", ja: "近くのアクティビティ", zh: "附近的活动", ko: "근처 활동", ru: "Ближайшие активности" },
  "home.createActivityPost": { th: "สร้างโพสต์กิจกรรม", en: "Create Activity Post", ja: "アクティビティ投稿を作成", zh: "创建活动帖子", ko: "활동 게시물 만들기", ru: "Создать пост" },
  "home.createPost": { th: "สร้างโพสต์", en: "Create Post", ja: "投稿を作成", zh: "创建帖子", ko: "게시물 만들기", ru: "Создать пост" },
  "home.searchActivities": { th: "ค้นหากิจกรรม...", en: "Search activities...", ja: "アクティビティを検索...", zh: "搜索活动...", ko: "활동 검색...", ru: "Поиск активностей..." },
  "home.typeToSearch": { th: "พิมพ์ค้นหากิจกรรม...", en: "Type to search...", ja: "検索してください...", zh: "输入搜索...", ko: "검색어 입력...", ru: "Введите для поиска..." },
  "home.noActivitiesFound": { th: "ไม่พบกิจกรรม", en: "No activities found", ja: "アクティビティが見つかりません", zh: "未找到活动", ko: "활동을 찾을 수 없습니다", ru: "Активности не найдены" },
  "home.selectProvince": { th: "เลือกจังหวัด", en: "Select Province", ja: "県を選択", zh: "选择省份", ko: "지역 선택", ru: "Выберите провинцию" },

  // Activity Card
  "activity.joinActivity": { th: "เข้าร่วมกิจกรรม", en: "Join Activity", ja: "参加する", zh: "加入活动", ko: "활동 참여", ru: "Присоединиться" },
  "activity.joining": { th: "กำลังเข้าร่วม...", en: "Joining...", ja: "参加中...", zh: "加入中...", ko: "참여 중...", ru: "Присоединение..." },
  "activity.goToChat": { th: "ไปที่แชทกลุ่ม", en: "Go to Group Chat", ja: "グループチャットへ", zh: "前往群聊", ko: "그룹 채팅으로", ru: "Перейти в чат" },
  "activity.joinedGoToChat": { th: "เข้าร่วมแล้ว - ไปที่แชท", en: "Joined - Go to Chat", ja: "参加済み - チャットへ", zh: "已加入 - 前往聊天", ko: "참여함 - 채팅으로", ru: "Вы в группе - В чат" },
  "activity.requestJoin": { th: "ขอเข้าร่วม", en: "Request to Join", ja: "参加リクエスト", zh: "请求加入", ko: "참여 요청", ru: "Запросить" },
  "activity.requesting": { th: "กำลังส่งคำขอ...", en: "Requesting...", ja: "リクエスト中...", zh: "请求中...", ko: "요청 중...", ru: "Отправка..." },
  "activity.pendingApproval": { th: "รอการอนุมัติ", en: "Pending Approval", ja: "承認待ち", zh: "等待批准", ko: "승인 대기", ru: "Ожидание" },

  // Create Activity Dialog
  "create.title": { th: "สร้างโพสต์กิจกรรม", en: "Create Activity Post", ja: "アクティビティ投稿を作成", zh: "创建活动帖子", ko: "활동 게시물 만들기", ru: "Создать пост" },
  "create.activity": { th: "กิจกรรม", en: "Activity", ja: "アクティビティ", zh: "活动", ko: "활동", ru: "Активность" },
  "create.description": { th: "รายละเอียด", en: "Description", ja: "説明", zh: "描述", ko: "설명", ru: "Описание" },
  "create.descriptionPlaceholder": { th: "บอกรายละเอียดเพิ่มเติมเกี่ยวกับกิจกรรม...", en: "Tell more about this activity...", ja: "アクティビティの詳細を記入...", zh: "请描述活动详情...", ko: "활동에 대해 자세히 알려주세요...", ru: "Расскажите подробнее..." },
  "create.image": { th: "รูปภาพ", en: "Image", ja: "画像", zh: "图片", ko: "이미지", ru: "Изображение" },
  "create.dateTime": { th: "วันเวลา", en: "Date & Time", ja: "日時", zh: "日期时间", ko: "날짜", ru: "Дата" },
  "create.province": { th: "จังหวัด", en: "Province", ja: "県", zh: "省份", ko: "지역", ru: "Провинция" },
  "create.privatePost": { th: "โพสต์ส่วนตัว", en: "Private Post", ja: "プライベート投稿", zh: "私密帖子", ko: "비공개 게시물", ru: "Личный пост" },
  "create.publicPost": { th: "โพสต์สาธารณะ", en: "Public Post", ja: "公開投稿", zh: "公开帖子", ko: "공개 게시물", ru: "Публичный пост" },
  "create.submit": { th: "สร้างโพสต์", en: "Create Post", ja: "投稿する", zh: "创建帖子", ko: "게시물 만들기", ru: "Создать" },
  "create.selectActivity": { th: "กรุณาเลือกกิจกรรม", en: "Please select an activity", ja: "アクティビティを選択してください", zh: "请选择活动", ko: "활동을 선택하세요", ru: "Выберите активность" },
  "create.success": { th: "สร้างโพสต์สำเร็จ!", en: "Post created!", ja: "投稿成功！", zh: "帖子已创建！", ko: "게시물이 생성되었습니다!", ru: "Пост создан!" },
  "create.error": { th: "เกิดข้อผิดพลาด", en: "An error occurred", ja: "エラーが発生しました", zh: "发生错误", ko: "오류가 발생했습니다", ru: "Произошла ошибка" },
  "create.premiumOnly": { th: "ฟีเจอร์สำหรับสมาชิก Pro หรือ Gold", en: "Feature for Pro or Gold members", ja: "ProまたはGoldメンバー限定", zh: "Pro或Gold会员专享", ko: "Pro 또는 Gold 회원 전용", ru: "Для Pro или Gold" },
  "create.premiumDesc": { th: "สมัครสมาชิกเพื่อใช้งานโพสต์ส่วนตัว", en: "Subscribe to use private posts", ja: "プライベート投稿を利用するには登録が必要です", zh: "订阅以使用私密帖子", ko: "비공개 게시물을 사용하려면 구독하세요", ru: "Подпишитесь для личных постов" },
  "create.subscribePremium": { th: "สมัครสมาชิก Pro หรือ Gold", en: "Subscribe Pro or Gold", ja: "ProまたはGoldに登録", zh: "订阅Pro或Gold", ko: "Pro 또는 Gold 구독", ru: "Подписка Pro или Gold" },
  "create.unlockPrivate": { th: "เพื่อปลดล็อคโพสต์ส่วนตัว", en: "to unlock private posts", ja: "でプライベート投稿を解除", zh: "以解锁私密帖子", ko: "비공개 게시물 잠금 해제", ru: "для личных постов" },
  "create.privateNote": { th: "โพสต์ส่วนตัว: ผู้ใช้อื่นต้องขออนุญาตก่อนเข้าร่วม", en: "Private post: others must request to join", ja: "プライベート投稿：他のユーザーは参加リクエストが必要です", zh: "私密帖子：其他用户需要请求加入", ko: "비공개 게시물: 다른 사용자는 참여를 요청해야 합니다", ru: "Личный пост: для участия нужен запрос" },
  "create.publicNote": { th: "กดปุ่มด้านบนเพื่อเปลี่ยนเป็นโพสต์ส่วนตัว", en: "Tap above to switch to private post", ja: "上のボタンでプライベート投稿に切り替え", zh: "点击上方按钮切换为私密帖子", ko: "위 버튼을 눌러 비공개로 전환", ru: "Нажмите выше для переключения" },
  "create.postLimitTitle": { th: "ถึงขีดจำกัดการโพสต์แล้ว", en: "Post limit reached", ja: "投稿制限に達しました", zh: "已达到发帖限制", ko: "게시물 한도 도달", ru: "Лимит постов достигнут" },
  "create.postLimitDesc": { th: "คุณสามารถสร้างโพสต์ได้สูงสุด 2 โพสต์ต่อวัน", en: "You can create up to 2 posts per day", ja: "1日最大2件まで投稿できます", zh: "每天最多可创建2个帖子", ko: "하루에 최대 2개의 게시물을 만들 수 있습니다", ru: "Максимум 2 поста в день" },
  "create.contentUnsafe": { th: "เนื้อหาไม่เหมาะสม", en: "Inappropriate content", ja: "不適切なコンテンツ", zh: "内容不当", ko: "부적절한 콘텐츠", ru: "Неприемлемый контент" },
   "create.contentUnsafeDesc": { th: "กรุณาแก้ไขเนื้อหาแล้วลองใหม่อีกครั้ง", en: "Please edit the content and try again", ja: "内容を修正して再度お試しください", zh: "请修改内容后重试", ko: "내용을 수정하고 다시 시도하세요", ru: "Исправьте содержание и повторите" },

   // Edit Activity Dialog
   "edit.title": { th: "แก้ไขโพสต์กิจกรรม", en: "Edit Activity Post", ja: "アクティビティ投稿を編集", zh: "编辑活动帖子", ko: "활동 게시물 수정", ru: "Редактировать пост" },
   "edit.selectActivity": { th: "กรุณาเลือกกิจกรรม", en: "Please select an activity", ja: "アクティビティを選択してください", zh: "请选择活动", ko: "활동을 선택하세요", ru: "Выберите активность" },
   "edit.updateSuccess": { th: "อัพเดทโพสต์สำเร็จ!", en: "Post updated!", ja: "投稿を更新しました！", zh: "帖子已更新！", ko: "게시물이 수정되었습니다!", ru: "Пост обновлен!" },
   "edit.deleteSuccess": { th: "ลบโพสต์สำเร็จ!", en: "Post deleted!", ja: "投稿を削除しました！", zh: "帖子已删除！", ko: "게시물이 삭제되었습니다!", ru: "Пост удален!" },
   "edit.deletePost": { th: "ลบโพสต์", en: "Delete Post", ja: "投稿を削除", zh: "删除帖子", ko: "게시물 삭제", ru: "Удалить пост" },
   "edit.confirmDeleteTitle": { th: "ยืนยันการลบโพสต์?", en: "Confirm Delete Post?", ja: "投稿を削除しますか？", zh: "确认删除帖子？", ko: "게시물을 삭제하시겠습니까?", ru: "Удалить пост?" },
   "edit.confirmDeleteDesc": { th: "การลบโพสต์จะไม่สามารถย้อนกลับได้ รวมถึงกลุ่มแชทที่เกี่ยวข้องจะถูกลบไปด้วย", en: "This action cannot be undone. Related group chats will also be deleted.", ja: "この操作は取り消せません。関連するグループチャットも削除されます。", zh: "此操作无法撤消。相关群聊也将被删除。", ko: "이 작업은 되돌릴 수 없습니다. 관련 그룹 채팅도 삭제됩니다.", ru: "Это действие нельзя отменить. Связанные чаты тоже будут удалены." },
   "edit.save": { th: "บันทึก", en: "Save", ja: "保存", zh: "保存", ko: "저장", ru: "Сохранить" },
   "edit.participants": { th: "จำนวนคน", en: "Participants", ja: "参加者数", zh: "参与人数", ko: "참가자 수", ru: "Участники" },
   "edit.participantsPlaceholder": { th: "ไม่จำกัด", en: "Unlimited", ja: "制限なし", zh: "不限", ko: "제한 없음", ru: "Без ограничений" },

  // Messages page
  "messages.title": { th: "ข้อความ", en: "Messages", ja: "メッセージ", zh: "消息", ko: "메시지", ru: "Сообщения" },
  "messages.private": { th: "ส่วนตัว", en: "Private", ja: "プライベート", zh: "私信", ko: "개인", ru: "Личные" },
  "messages.group": { th: "กลุ่มกิจกรรม", en: "Activity Groups", ja: "グループ", zh: "活动群", ko: "그룹", ru: "Группы" },
  "messages.noPrivate": { th: "ยังไม่มีข้อความส่วนตัว", en: "No private messages yet", ja: "プライベートメッセージはまだありません", zh: "暂无私信", ko: "개인 메시지가 아직 없습니다", ru: "Личных сообщений нет" },
  "messages.startConversation": { th: "ไปที่โปรไฟล์ผู้ใช้เพื่อเริ่มสนทนา", en: "Go to a user's profile to start a conversation", ja: "ユーザーのプロフィールから会話を始めましょう", zh: "前往用户资料页开始对话", ko: "사용자 프로필로 이동하여 대화를 시작하세요", ru: "Перейдите в профиль для начала" },
  "messages.noGroups": { th: "ยังไม่มีแชทกลุ่มกิจกรรม", en: "No activity group chats yet", ja: "グループチャットはまだありません", zh: "暂无活动群聊", ko: "활동 그룹 채팅이 아직 없습니다", ru: "Групповых чатов нет" },
  "messages.joinToChat": { th: "สร้างหรือเข้าร่วมกิจกรรมเพื่อเริ่มแชทกลุ่ม", en: "Create or join an activity to start group chat", ja: "アクティビティを作成または参加してグループチャットを始めましょう", zh: "创建或加入活动以开始群聊", ko: "활동을 만들거나 참여하여 그룹 채팅을 시작하세요", ru: "Создайте или присоединитесь к активности" },
  "messages.sentImage": { th: "📷 ส่งรูปภาพ", en: "📷 Sent an image", ja: "📷 画像を送信", zh: "📷 发送了图片", ko: "📷 이미지 전송", ru: "📷 Отправлено изображение" },
  "messages.sentAudio": { th: "🎤 ส่งข้อความเสียง", en: "🎤 Sent a voice message", ja: "🎤 音声メッセージ", zh: "🎤 发送了语音", ko: "🎤 음성 메시지", ru: "🎤 Голосовое сообщение" },
  "messages.noMessages": { th: "ยังไม่มีข้อความ", en: "No messages yet", ja: "メッセージなし", zh: "暂无消息", ko: "메시지 없음", ru: "Сообщений нет" },
  "messages.justNow": { th: "เมื่อสักครู่", en: "Just now", ja: "たった今", zh: "刚刚", ko: "방금", ru: "Только что" },
  "messages.minutesAgo": { th: "นาที", en: "min", ja: "分", zh: "分", ko: "분", ru: "мин" },
  "messages.hoursAgo": { th: "ชม.", en: "hr", ja: "時間", zh: "小时", ko: "시간", ru: "ч" },
  "messages.user": { th: "ผู้ใช้", en: "User", ja: "ユーザー", zh: "用户", ko: "사용자", ru: "Пользователь" },

  // Reel Comments
  "comments.title": { th: "ความคิดเห็น", en: "Comments", ja: "コメント", zh: "评论", ko: "댓글", ru: "Комментарии" },
  "comments.noComments": { th: "ยังไม่มีความคิดเห็น", en: "No comments yet", ja: "コメントはまだありません", zh: "暂无评论", ko: "댓글이 아직 없습니다", ru: "Комментариев нет" },
  "comments.beFirst": { th: "เป็นคนแรกที่แสดงความคิดเห็น!", en: "Be the first to comment!", ja: "最初のコメントを残しましょう！", zh: "成为第一个评论的人！", ko: "첫 댓글을 남겨보세요!", ru: "Будьте первым!" },
  "comments.placeholder": { th: "เขียนความคิดเห็น...", en: "Write a comment...", ja: "コメントを書く...", zh: "写评论...", ko: "댓글 작성...", ru: "Написать комментарий..." },
  "comments.replyTo": { th: "ตอบกลับ", en: "Reply to", ja: "返信先", zh: "回复", ko: "답글", ru: "Ответ" },
  "comments.reply": { th: "ตอบกลับ", en: "Reply", ja: "返信", zh: "回复", ko: "답글", ru: "Ответить" },
  "comments.cancel": { th: "ยกเลิก", en: "Cancel", ja: "キャンセル", zh: "取消", ko: "취소", ru: "Отмена" },
  "comments.errorSend": { th: "เกิดข้อผิดพลาดในการส่งความคิดเห็น", en: "Error sending comment", ja: "コメント送信エラー", zh: "发送评论时出错", ko: "댓글 전송 오류", ru: "Ошибка отправки" },
  "comments.errorDelete": { th: "เกิดข้อผิดพลาดในการลบความคิดเห็น", en: "Error deleting comment", ja: "コメント削除エラー", zh: "删除评论时出错", ko: "댓글 삭제 오류", ru: "Ошибка удаления" },

  // Create Reel
  "reel.createTitle": { th: "สร้าง Reel ใหม่", en: "Create New Reel", ja: "新しいリールを作成", zh: "创建新短视频", ko: "새 릴스 만들기", ru: "Создать Рилс" },
  "reel.uploadVideo": { th: "อัปโหลดวิดีโอ (9:16)", en: "Upload Video (9:16)", ja: "動画をアップロード (9:16)", zh: "上传视频 (9:16)", ko: "동영상 업로드 (9:16)", ru: "Загрузить видео (9:16)" },
  "reel.clickToUpload": { th: "คลิกเพื่ออัปโหลดวิดีโอ", en: "Click to upload video", ja: "クリックして動画をアップロード", zh: "点击上传视频", ko: "클릭하여 동영상 업로드", ru: "Нажмите для загрузки" },
  "reel.recommendSize": { th: "แนะนำขนาด 9:16", en: "Recommended 9:16", ja: "推奨サイズ 9:16", zh: "推荐 9:16", ko: "권장 9:16", ru: "Рекомендуется 9:16" },
  "reel.description": { th: "คำอธิบาย", en: "Description", ja: "説明", zh: "描述", ko: "설명", ru: "Описание" },
  "reel.descPlaceholder": { th: "เขียนคำอธิบายสำหรับ Reel ของคุณ...", en: "Write a description for your Reel...", ja: "リールの説明を書く...", zh: "为您的短视频写描述...", ko: "릴스 설명 작성...", ru: "Напишите описание..." },
  "reel.postReel": { th: "โพสต์ Reel", en: "Post Reel", ja: "リールを投稿", zh: "发布短视频", ko: "릴스 게시", ru: "Опубликовать" },
  "reel.uploading": { th: "กำลังอัปโหลด...", en: "Uploading...", ja: "アップロード中...", zh: "上传中...", ko: "업로드 중...", ru: "Загрузка..." },
  "reel.success": { th: "โพสต์ Reel สำเร็จ!", en: "Reel posted!", ja: "リール投稿成功！", zh: "短视频已发布！", ko: "릴스 게시 완료!", ru: "Рилс опубликован!" },
  "reel.errorPost": { th: "เกิดข้อผิดพลาดในการโพสต์ Reel", en: "Error posting Reel", ja: "リール投稿エラー", zh: "发布短视频时出错", ko: "릴스 게시 오류", ru: "Ошибка публикации" },
  "reel.videoOnly": { th: "กรุณาเลือกไฟล์วิดีโอเท่านั้น", en: "Please select a video file only", ja: "動画ファイルのみ選択してください", zh: "请只选择视频文件", ko: "동영상 파일만 선택하세요", ru: "Только видео файлы" },
  "reel.fileTooLarge": { th: "ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 500MB)", en: "File too large (max 500MB)", ja: "ファイルが大きすぎます（最大500MB）", zh: "文件太大（最大500MB）", ko: "파일이 너무 큽니다 (최대 500MB)", ru: "Файл слишком большой (макс 500МБ)" },
  "reel.selectVideo": { th: "กรุณาเลือกวิดีโอ", en: "Please select a video", ja: "動画を選択してください", zh: "请选择视频", ko: "동영상을 선택하세요", ru: "Выберите видео" },

  // Shop page
  "shop.title": { th: "ร้านค้าในพื้นที่", en: "Local Shops", ja: "近くのお店", zh: "本地商店", ko: "지역 상점", ru: "Местные магазины" },
  "shop.subtitle": { th: "ดีลใกล้คุณ", en: "Deals near you", ja: "近くのお得情報", zh: "附近的优惠", ko: "근처 딜", ru: "Скидки рядом" },
  "shop.category": { th: "หมวดหมู่", en: "Category", ja: "カテゴリ", zh: "分类", ko: "카테고리", ru: "Категория" },
  "shop.noShops": { th: "ยังไม่มีร้านค้าในพื้นที่นี้", en: "No shops in this area yet", ja: "この地域にはまだお店がありません", zh: "该地区暂无商店", ko: "이 지역에 상점이 없습니다", ru: "Магазинов пока нет" },
  "shop.addShop": { th: "เพิ่มร้านค้า", en: "Add Shop", ja: "お店を追加", zh: "添加商店", ko: "상점 추가", ru: "Добавить магазин" },
  "shop.createTitle": { th: "สร้างร้านค้า", en: "Create Shop", ja: "お店を作成", zh: "创建商店", ko: "상점 만들기", ru: "Создать магазин" },
  "shop.shopName": { th: "ชื่อร้านค้า", en: "Shop Name", ja: "店名", zh: "店铺名称", ko: "상점 이름", ru: "Название магазина" },
  "shop.shopNamePlaceholder": { th: "ชื่อร้านค้า...", en: "Shop name...", ja: "店名を入力...", zh: "店铺名称...", ko: "상점 이름...", ru: "Название..." },
  "shop.descriptionPlaceholder": { th: "บอกรายละเอียดเพิ่มเติมเกี่ยวกับร้านค้า...", en: "Tell more about this shop...", ja: "お店の詳細を記入...", zh: "请描述店铺详情...", ko: "가게에 대해 자세히 알려주세요...", ru: "Расскажите подробнее о магазине..." },
  "shop.createSuccess": { th: "สร้างร้านค้าสำเร็จ!", en: "Shop created!", ja: "お店を作成しました！", zh: "商店已创建！", ko: "상점이 생성되었습니다!", ru: "Магазин создан!" },
  "shop.enterName": { th: "กรุณาใส่ชื่อร้านค้า", en: "Please enter shop name", ja: "店名を入力してください", zh: "请输入店铺名称", ko: "상점 이름을 입력하세요", ru: "Введите название" },
  "shop.contentUnsafe": { th: "เนื้อหาไม่ผ่านการตรวจสอบ", en: "Content did not pass review", ja: "コンテンツが審査に通りませんでした", zh: "内容未通过审核", ko: "콘텐츠가 검토를 통과하지 못했습니다", ru: "Контент не прошел проверку" },
  "shop.searchCategory": { th: "พิมพ์เพื่อค้นหาหมวดหมู่...", en: "Type to search category...", ja: "カテゴリを検索...", zh: "搜索分类...", ko: "카테고리 검색...", ru: "Поиск категории..." },
  "shop.searchCategoryInput": { th: "ค้นหาหมวดหมู่...", en: "Search category...", ja: "カテゴリ検索...", zh: "搜索分类...", ko: "카테고리 검색...", ru: "Поиск..." },
   "shop.noCategoryFound": { th: "ไม่พบหมวดหมู่", en: "No category found", ja: "カテゴリが見つかりません", zh: "未找到分类", ko: "카테고리를 찾을 수 없습니다", ru: "Категория не найдена" },
   "shop.report": { th: "รายงาน", en: "Report", ja: "報告", zh: "举报", ko: "신고", ru: "Пожаловаться" },
   "shop.sendMessage": { th: "ส่งข้อความ", en: "Send Message", ja: "メッセージを送る", zh: "发送消息", ko: "메시지 보내기", ru: "Отправить сообщение" },
   "shop.confirmDelete": { th: "ยืนยันการลบร้านค้า", en: "Confirm Delete Shop", ja: "お店の削除を確認", zh: "确认删除商店", ko: "상점 삭제 확인", ru: "Подтвердите удаление" },
   "shop.confirmDeleteDesc": { th: "คุณแน่ใจหรือไม่ว่าต้องการลบร้านค้านี้? การกระทำนี้ไม่สามารถย้อนกลับได้", en: "Are you sure you want to delete this shop? This action cannot be undone.", ja: "このお店を削除してもよろしいですか？この操作は取り消せません。", zh: "您确定要删除此商店吗？此操作无法撤消。", ko: "이 상점을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.", ru: "Вы уверены? Это действие нельзя отменить." },
   "shop.deleteSuccess": { th: "ลบร้านค้าสำเร็จ", en: "Shop deleted", ja: "お店を削除しました", zh: "商店已删除", ko: "상점이 삭제되었습니다", ru: "Магазин удален" },
   "shop.deleteError": { th: "เกิดข้อผิดพลาด", en: "An error occurred", ja: "エラーが発生しました", zh: "出现错误", ko: "오류가 발생했습니다", ru: "Произошла ошибка" },
   "shop.editTitle": { th: "แก้ไขร้านค้า", en: "Edit Shop", ja: "お店を編集", zh: "编辑商店", ko: "상점 편집", ru: "Редактировать магазин" },
   "shop.updateSuccess": { th: "อัปเดตร้านค้าสำเร็จ!", en: "Shop updated!", ja: "お店を更新しました！", zh: "商店已更新！", ko: "상점이 업데이트되었습니다!", ru: "Магазин обновлён!" },
   "common.cancel": { th: "ยกเลิก", en: "Cancel", ja: "キャンセル", zh: "取消", ko: "취소", ru: "Отмена" },
   "common.delete": { th: "ลบ", en: "Delete", ja: "削除", zh: "删除", ko: "삭제", ru: "Удалить" },
   "common.deleting": { th: "กำลังลบ...", en: "Deleting...", ja: "削除中...", zh: "删除中...", ko: "삭제 중...", ru: "Удаление..." },

  // Image Upload
  "upload.clickToUpload": { th: "คลิกเพื่ออัพโหลดรูปภาพ", en: "Click to upload image", ja: "クリックして画像をアップロード", zh: "点击上传图片", ko: "클릭하여 이미지 업로드", ru: "Нажмите для загрузки" },
  "upload.maxSize": { th: "ขนาดไม่เกิน 5MB", en: "Max size 5MB", ja: "最大5MB", zh: "最大5MB", ko: "최대 5MB", ru: "Макс 5МБ" },
  "upload.uploading": { th: "กำลังอัพโหลด...", en: "Uploading...", ja: "アップロード中...", zh: "上传中...", ko: "업로드 중...", ru: "Загрузка..." },
  "upload.success": { th: "อัพโหลดรูปภาพสำเร็จ", en: "Image uploaded", ja: "画像をアップロードしました", zh: "图片上传成功", ko: "이미지 업로드 완료", ru: "Изображение загружено" },
  "upload.fileTooLarge": { th: "ไฟล์มีขนาดใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB", en: "File too large. Please select a file under 5MB", ja: "ファイルが大きすぎます。5MB以下のファイルを選択してください", zh: "文件太大，请选择5MB以下的文件", ko: "파일이 너무 큽니다. 5MB 이하의 파일을 선택하세요", ru: "Файл слишком большой. Выберите до 5МБ" },
  "upload.invalidType": { th: "รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP, GIF)", en: "Only image files supported (JPEG, PNG, WebP, GIF)", ja: "画像ファイルのみ対応（JPEG, PNG, WebP, GIF）", zh: "仅支持图片文件（JPEG, PNG, WebP, GIF）", ko: "이미지 파일만 지원 (JPEG, PNG, WebP, GIF)", ru: "Только изображения (JPEG, PNG, WebP, GIF)" },
  "upload.loginFirst": { th: "กรุณาเข้าสู่ระบบก่อนอัพโหลดรูปภาพ", en: "Please log in before uploading", ja: "アップロードする前にログインしてください", zh: "请先登录再上传", ko: "업로드하기 전에 로그인하세요", ru: "Войдите перед загрузкой" },
  "upload.error": { th: "เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ", en: "Error uploading image", ja: "画像アップロードエラー", zh: "上传图片时出错", ko: "이미지 업로드 오류", ru: "Ошибка загрузки" },

  // Province selector
  "province.search": { th: "ค้นหาจังหวัด...", en: "Search province...", ja: "県を検索...", zh: "搜索省份...", ko: "지역 검색...", ru: "Поиск провинции..." },
  "province.notFound": { th: "ไม่พบจังหวัด", en: "Province not found", ja: "県が見つかりません", zh: "未找到省份", ko: "지역을 찾을 수 없습니다", ru: "Провинция не найдена" },
  "province.selectPlaceholder": { th: "เลือกจังหวัด...", en: "Select province...", ja: "県を選択...", zh: "选择省份...", ko: "지역 선택...", ru: "Выберите провинцию..." },
  "province.all": { th: "ทุกจังหวัด", en: "All Provinces", ja: "全都道府県", zh: "所有省份", ko: "모든 지역", ru: "Все регионы" },

  // Activity Selector
  "activitySelector.placeholder": { th: "เลือกกิจกรรม...", en: "Select activity...", ja: "アクティビティを選択...", zh: "选择活动...", ko: "활동 선택...", ru: "Выберите активность..." },


  "nav.home": { th: "หน้าหลัก", en: "Home", ja: "ホーム", zh: "首页", ko: "홈", ru: "Главная" },
  "nav.reels": { th: "รีลส์", en: "Reels", ja: "リール", zh: "短视频", ko: "릴스", ru: "Рилс" },
  "nav.messages": { th: "ข้อความ", en: "Messages", ja: "メッセージ", zh: "消息", ko: "메시지", ru: "Сообщения" },
  "nav.profile": { th: "โปรไฟล์", en: "Profile", ja: "プロフィール", zh: "个人资料", ko: "프로필", ru: "Профиль" },

  // Theme Selector
  "theme.title": { th: "เลือกธีมของคุณ", en: "Choose your theme", ja: "テーマを選択", zh: "选择主题", ko: "테마 선택", ru: "Выберите тему" },
  "theme.description": { th: "เลือก Theme สำหรับโปรไฟล์ของคุณ Theme จะแสดงทั้งแอปสำหรับคุณ และแสดงที่หน้าโปรไฟล์เมื่อผู้อื่นเข้ามาดู", en: "Choose a theme for your profile. The theme will be applied across the app and shown on your profile page.", ja: "プロフィールのテーマを選択してください。テーマはアプリ全体とプロフィールページに適用されます。", zh: "选择个人资料主题。主题将应用于整个应用和您的个人资料页面。", ko: "프로필 테마를 선택하세요. 테마는 앱 전체와 프로필 페이지에 적용됩니다.", ru: "Выберите тему для профиля. Тема будет применена ко всему приложению и отображаться на вашем профиле." },
  "theme.subscribeGold": { th: "สมัคร Gold", en: "Subscribe Gold", ja: "Gold に登録", zh: "订阅 Gold", ko: "Gold 구독", ru: "Подписка Gold" },

  // Subscription Plans
  "sub.subscribe": { th: "สมัครสมาชิก", en: "Subscribe", ja: "登録する", zh: "订阅", ko: "구독하기", ru: "Подписаться" },
  "sub.changePlan": { th: "เปลี่ยนแพลน", en: "Change Plan", ja: "プラン変更", zh: "更改计划", ko: "플랜 변경", ru: "Сменить план" },
  "sub.managePlan": { th: "จัดการแพลน", en: "Manage Plan", ja: "プラン管理", zh: "管理计划", ko: "플랜 관리", ru: "Управление планом" },
  "sub.manageSubscription": { th: "จัดการการสมัครสมาชิก", en: "Manage Subscription", ja: "サブスクリプション管理", zh: "管理订阅", ko: "구독 관리", ru: "Управление подпиской" },
  "sub.expiresAt": { th: "หมดอายุ:", en: "Expires:", ja: "有効期限:", zh: "到期:", ko: "만료:", ru: "Истекает:" },
  "sub.privatePost": { th: "สร้างโพสต์ส่วนตัวได้", en: "Create private posts", ja: "プライベート投稿作成", zh: "创建私密帖子", ko: "비공개 게시물 작성", ru: "Личные публикации" },
  "sub.fastCheckin": { th: "Fast Check-in ได้ทุกวัน", en: "Daily Fast Check-in", ja: "毎日ファストチェックイン", zh: "每日快速签到", ko: "매일 빠른 체크인", ru: "Ежедневная быстрая регистрация" },
  "sub.themes": { th: "เลือกธีมพิเศษได้", en: "Access premium themes", ja: "プレミアムテーマ", zh: "高级主题", ko: "프리미엄 테마", ru: "Премиум темы" },
  "sub.themesGoldOnly": { th: "เลือกธีมพิเศษ (Gold เท่านั้น)", en: "Premium themes (Gold only)", ja: "プレミアムテーマ (Gold のみ)", zh: "高级主题 (仅 Gold)", ko: "프리미엄 테마 (Gold 전용)", ru: "Премиум темы (только Gold)" },
  "sub.selectDuration": { th: "เลือกระยะเวลา:", en: "Select duration:", ja: "期間を選択:", zh: "选择时长:", ko: "기간 선택:", ru: "Выберите период:" },
  "sub.1month": { th: "1 เดือน", en: "1 month", ja: "1ヶ月", zh: "1个月", ko: "1개월", ru: "1 месяц" },
  "sub.3months": { th: "3 เดือน", en: "3 months", ja: "3ヶ月", zh: "3个月", ko: "3개월", ru: "3 месяца" },
  "sub.6months": { th: "6 เดือน", en: "6 months", ja: "6ヶ月", zh: "6个月", ko: "6개월", ru: "6 месяцев" },
  "sub.save10": { th: "ประหยัด 10%", en: "Save 10%", ja: "10%オフ", zh: "省10%", ko: "10% 할인", ru: "Скидка 10%" },
  "sub.save20": { th: "ประหยัด 20%", en: "Save 20%", ja: "20%オフ", zh: "省20%", ko: "20% 할인", ru: "Скидка 20%" },
  "sub.paymentMethod": { th: "วิธีชำระเงิน:", en: "Payment method:", ja: "支払い方法:", zh: "支付方式:", ko: "결제 방법:", ru: "Способ оплаты:" },
  "sub.creditCard": { th: "บัตรเครดิต", en: "Credit Card", ja: "クレジットカード", zh: "信用卡", ko: "신용카드", ru: "Банковская карта" },
  "sub.promptpayDesc": { th: "ชำระผ่าน PromptPay QR Code", en: "Pay via PromptPay QR Code", ja: "PromptPay QR で支払い", zh: "通过 PromptPay 二维码支付", ko: "PromptPay QR 결제", ru: "Оплата через PromptPay QR" },
  "sub.cardDesc": { th: "ชำระผ่านบัตรเครดิต/เดบิต", en: "Pay via credit/debit card", ja: "クレジット/デビットカードで支払い", zh: "通过信用卡/借记卡支付", ko: "신용/체크카드 결제", ru: "Оплата картой" },
  "sub.checkoutError": { th: "เกิดข้อผิดพลาดในการสร้าง checkout", en: "Error creating checkout", ja: "チェックアウト作成エラー", zh: "创建结账时出错", ko: "결제 생성 오류", ru: "Ошибка создания оплаты" },
   "sub.portalError": { th: "เกิดข้อผิดพลาดในการเปิดหน้าจัดการ", en: "Error opening management page", ja: "管理ページのエラー", zh: "打开管理页面时出错", ko: "관리 페이지 오류", ru: "Ошибка открытия страницы управления" },

   // User Profile page
   "userProfile.title": { th: "โปรไฟล์", en: "Profile", ja: "プロフィール", zh: "个人资料", ko: "프로필", ru: "Профиль" },
   "userProfile.joinedAt": { th: "เข้าร่วมเมื่อ", en: "Joined", ja: "参加日", zh: "加入于", ko: "가입일", ru: "Присоединился" },
   "userProfile.follow": { th: "ติดตาม", en: "Follow", ja: "フォロー", zh: "关注", ko: "팔로우", ru: "Подписаться" },
   "userProfile.unfollow": { th: "เลิกติดตาม", en: "Unfollow", ja: "フォロー解除", zh: "取消关注", ko: "언팔로우", ru: "Отписаться" },
   "userProfile.sendMessage": { th: "ส่งข้อความ", en: "Message", ja: "メッセージ", zh: "发消息", ko: "메시지", ru: "Сообщение" },
   "userProfile.activitiesJoined": { th: "กิจกรรมที่เข้าร่วม", en: "Activities Joined", ja: "参加アクティビティ", zh: "参与的活动", ko: "참여한 활동", ru: "Активности" },
   "userProfile.noActivitiesJoined": { th: "ยังไม่มีกิจกรรมที่เข้าร่วม", en: "No activities joined yet", ja: "まだアクティビティに参加していません", zh: "暂无参与的活动", ko: "참여한 활동이 없습니다", ru: "Нет активностей" },
   "userProfile.noPosts": { th: "ยังไม่มีโพสต์กิจกรรม", en: "No activity posts yet", ja: "アクティビティ投稿はまだありません", zh: "暂无活动帖子", ko: "활동 게시물이 없습니다", ru: "Постов нет" },
   "userProfile.noShops": { th: "ยังไม่มีร้านค้า", en: "No shops yet", ja: "お店はまだありません", zh: "暂无商店", ko: "상점이 없습니다", ru: "Магазинов нет" },
   "userProfile.noReels": { th: "ยังไม่มี Reels", en: "No Reels yet", ja: "リールはまだありません", zh: "暂无短视频", ko: "릴스가 없습니다", ru: "Рилсов нет" },
   "userProfile.goToGroupChat": { th: "ไปที่แชทกลุ่ม", en: "Go to Group Chat", ja: "グループチャットへ", zh: "前往群聊", ko: "그룹 채팅으로", ru: "В чат группы" },
   "userProfile.joinActivity": { th: "Join Activity", en: "Join Activity", ja: "参加する", zh: "加入活动", ko: "활동 참여", ru: "Присоединиться" },
   "userProfile.requestJoin": { th: "ขอเข้าร่วม", en: "Request to Join", ja: "参加リクエスト", zh: "请求加入", ko: "참여 요청", ru: "Запросить" },
   "userProfile.pendingApproval": { th: "รอการอนุมัติ", en: "Pending", ja: "承認待ち", zh: "等待批准", ko: "승인 대기", ru: "Ожидание" },
   "userProfile.followed": { th: "ติดตามแล้ว", en: "Followed", ja: "フォローしました", zh: "已关注", ko: "팔로우함", ru: "Подписан" },
   "userProfile.unfollowed": { th: "เลิกติดตามแล้ว", en: "Unfollowed", ja: "フォロー解除しました", zh: "已取消关注", ko: "언팔로우함", ru: "Отписан" },
   "userProfile.joinedSuccess": { th: "เข้าร่วมกิจกรรมสำเร็จ!", en: "Joined activity!", ja: "アクティビティに参加しました！", zh: "已加入活动！", ko: "활동에 참여했습니다!", ru: "Вы присоединились!" },
   "userProfile.requestSent": { th: "ส่งคำขอเข้าร่วมแล้ว", en: "Join request sent", ja: "参加リクエストを送信しました", zh: "已发送加入请求", ko: "참여 요청을 보냈습니다", ru: "Запрос отправлен" },
   "userProfile.notFoundTitle": { th: "ไม่พบผู้ใช้นี้", en: "User not found", ja: "ユーザーが見つかりません", zh: "未找到用户", ko: "사용자를 찾을 수 없습니다", ru: "Пользователь не найден" },
   "userProfile.notFoundDesc": { th: "ไม่พบข้อมูลผู้ใช้นี้ในระบบ", en: "This user's information was not found", ja: "このユーザーの情報は見つかりませんでした", zh: "未找到该用户的信息", ko: "이 사용자의 정보를 찾을 수 없습니다", ru: "Информация о пользователе не найдена" },
   "userProfile.suspendedTitle": { th: "บัญชีนี้ถูกระงับ", en: "Account suspended", ja: "アカウントが停止されました", zh: "账号已被暂停", ko: "계정이 정지되었습니다", ru: "Аккаунт заблокирован" },
   "userProfile.suspendedDesc": { th: "บัญชีผู้ใช้นี้ถูกระงับการใช้งานแล้ว", en: "This account has been suspended", ja: "このアカウントは停止されています", zh: "该账号已被暂停使用", ko: "이 계정은 정지되었습니다", ru: "Этот аккаунт заблокирован" },
   "userProfile.blockedTitle": { th: "ไม่สามารถเข้าถึงโปรไฟล์นี้ได้", en: "Cannot access this profile", ja: "このプロフィールにアクセスできません", zh: "无法访问此个人资料", ko: "이 프로필에 접근할 수 없습니다", ru: "Нет доступа к профилю" },
   "userProfile.blockedDesc": { th: "คุณถูกบล็อกจากผู้ใช้นี้ หรือผู้ใช้นี้ไม่พร้อมใช้งาน", en: "You are blocked by this user or this user is unavailable", ja: "このユーザーにブロックされているか利用できません", zh: "您被此用户屏蔽或该用户不可用", ko: "이 사용자에게 차단되었거나 사용자를 이용할 수 없습니다", ru: "Вы заблокированы или пользователь недоступен" },
   "userProfile.back": { th: "กลับ", en: "Back", ja: "戻る", zh: "返回", ko: "뒤로", ru: "Назад" },
   "userProfile.blockUser": { th: "บล็อกผู้ใช้นี้", en: "Block User", ja: "ユーザーをブロック", zh: "屏蔽用户", ko: "사용자 차단", ru: "Заблокировать" },
   "userProfile.unblockUser": { th: "ปลดบล็อก", en: "Unblock", ja: "ブロック解除", zh: "解除屏蔽", ko: "차단 해제", ru: "Разблокировать" },
   "userProfile.reportUser": { th: "รายงานผู้ใช้นี้", en: "Report User", ja: "ユーザーを報告", zh: "举报用户", ko: "사용자 신고", ru: "Пожаловаться" },
   "userProfile.blockConfirmTitle": { th: "บล็อก", en: "Block", ja: "ブロック", zh: "屏蔽", ko: "차단", ru: "Заблокировать" },
   "userProfile.blockConfirmDesc1": { th: "เมื่อบล็อกแล้ว ผู้ใช้นี้จะไม่สามารถ:", en: "Once blocked, this user will not be able to:", ja: "ブロックすると、このユーザーは:", zh: "屏蔽后，该用户将无法:", ko: "차단하면 이 사용자는:", ru: "После блокировки пользователь не сможет:" },
   "userProfile.blockItem1": { th: "ส่งข้อความถึงคุณได้", en: "Send you messages", ja: "メッセージを送ること", zh: "给您发消息", ko: "메시지 보내기", ru: "Отправлять сообщения" },
   "userProfile.blockItem2": { th: "ดูโปรไฟล์ของคุณได้", en: "View your profile", ja: "プロフィールを見ること", zh: "查看您的个人资料", ko: "프로필 보기", ru: "Просматривать профиль" },
   "userProfile.blockItem3": { th: "เห็นโพสต์หรือคลิปของคุณได้", en: "See your posts or clips", ja: "投稿やクリップを見ること", zh: "看到您的帖子或视频", ko: "게시물이나 클립 보기", ru: "Видеть посты и клипы" },
   "userProfile.blockNote": { th: "คุณสามารถปลดบล็อกได้ในหน้าตั้งค่า", en: "You can unblock in Settings", ja: "設定からブロック解除できます", zh: "您可以在设置中解除屏蔽", ko: "설정에서 차단 해제할 수 있습니다", ru: "Вы можете разблокировать в настройках" },
   "userProfile.blockedToast": { th: "บล็อกแล้ว", en: "Blocked", ja: "ブロックしました", zh: "已屏蔽", ko: "차단됨", ru: "Заблокирован" },
   "userProfile.unblockedToast": { th: "ปลดบล็อกแล้ว", en: "Unblocked", ja: "ブロック解除しました", zh: "已解除屏蔽", ko: "차단 해제됨", ru: "Разблокирован" },
   "userProfile.alreadyBlocked": { th: "ผู้ใช้นี้ถูกบล็อกอยู่แล้ว", en: "User already blocked", ja: "既にブロック済みです", zh: "该用户已被屏蔽", ko: "이미 차단된 사용자입니다", ru: "Пользователь уже заблокирован" },
   "userProfile.noGroupChat": { th: "ไม่พบกลุ่มแชทสำหรับกิจกรรมนี้", en: "No group chat found for this activity", ja: "このアクティビティのグループチャットが見つかりません", zh: "未找到此活动的群聊", ko: "이 활동의 그룹 채팅을 찾을 수 없습니다", ru: "Групповой чат не найден" },
   "userProfile.cannotFollowSelf": { th: "ไม่สามารถติดตามตัวเองได้", en: "Cannot follow yourself", ja: "自分をフォローできません", zh: "无法关注自己", ko: "자신을 팔로우할 수 없습니다", ru: "Нельзя подписаться на себя" },
   "common.user": { th: "ผู้ใช้", en: "User", ja: "ユーザー", zh: "用户", ko: "사용자", ru: "Пользователь" },
   "common.block": { th: "บล็อก", en: "Block", ja: "ブロック", zh: "屏蔽", ko: "차단", ru: "Заблокировать" },
   "common.edit": { th: "แก้ไข", en: "Edit", ja: "編集", zh: "编辑", ko: "편집", ru: "Редактировать" },
   "common.people": { th: "คน", en: "people", ja: "人", zh: "人", ko: "명", ru: "чел." },

   // Profile page
   "profile.title": { th: "โปรไฟล์", en: "Profile", ja: "プロフィール", zh: "个人资料", ko: "프로필", ru: "Профиль" },
   "profile.checkins": { th: "เช็คอิน", en: "Check-ins", ja: "チェックイン", zh: "签到", ko: "체크인", ru: "Чекины" },
   "profile.followers": { th: "ผู้ติดตาม", en: "Followers", ja: "フォロワー", zh: "粉丝", ko: "팔로워", ru: "Подписчики" },
   "profile.following": { th: "กำลังติดตาม", en: "Following", ja: "フォロー中", zh: "关注", ko: "팔로잉", ru: "Подписки" },
   "profile.activitiesJoined": { th: "กิจกรรมที่เข้าร่วม", en: "Activities Joined", ja: "参加アクティビティ", zh: "参与的活动", ko: "참여한 활동", ru: "Активности" },
   "profile.noActivitiesJoined": { th: "ยังไม่มีกิจกรรมที่เข้าร่วม", en: "No activities joined yet", ja: "まだアクティビティに参加していません", zh: "暂无参与的活动", ko: "참여한 활동이 없습니다", ru: "Нет активностей" },
   "profile.joinActivitiesForExp": { th: "เข้าร่วมกิจกรรมและเช็คอินเพื่อรับ EXP", en: "Join activities and check in to earn EXP", ja: "アクティビティに参加してチェックインしてEXPを獲得", zh: "加入活动并签到以获得EXP", ko: "활동에 참여하고 체크인하여 EXP를 받으세요", ru: "Участвуйте и получайте EXP" },
   "profile.createPost": { th: "สร้างโพสต์", en: "Create Post", ja: "投稿する", zh: "创建帖子", ko: "게시물 만들기", ru: "Создать пост" },
   "profile.noPosts": { th: "ยังไม่มีกิจกรรมที่โพสต์", en: "No activity posts yet", ja: "投稿はまだありません", zh: "暂无活动帖子", ko: "활동 게시물이 없습니다", ru: "Постов нет" },
   "profile.groupChat": { th: "แชทกลุ่ม", en: "Group Chat", ja: "グループチャット", zh: "群聊", ko: "그룹 채팅", ru: "Групповой чат" },
   "profile.noShops": { th: "ยังไม่มีร้านค้า", en: "No shops yet", ja: "お店はまだありません", zh: "暂无商店", ko: "상점이 없습니다", ru: "Магазинов нет" },
   "profile.createShop": { th: "สร้างร้านค้า", en: "Create Shop", ja: "お店を作成", zh: "创建商店", ko: "상점 만들기", ru: "Создать магазин" },
   "profile.noReels": { th: "ยังไม่มี Reels", en: "No Reels yet", ja: "リールはまだありません", zh: "暂无短视频", ko: "릴스가 없습니다", ru: "Рилсов нет" },
   "profile.createReel": { th: "สร้าง Reel", en: "Create Reel", ja: "リール作成", zh: "创建短视频", ko: "릴스 만들기", ru: "Создать Рилс" },
   "profile.noLikedReels": { th: "ยังไม่มี Reels ที่ถูกใจ", en: "No liked Reels yet", ja: "いいねしたリールはまだありません", zh: "暂无点赞的短视频", ko: "좋아요한 릴스가 없습니다", ru: "Нет понравившихся рилсов" },
   "profile.deleteShopSuccess": { th: "ลบร้านค้าสำเร็จ!", en: "Shop deleted!", ja: "お店を削除しました！", zh: "商店已删除！", ko: "상점이 삭제되었습니다!", ru: "Магазин удален!" },
   "profile.confirmDeleteShop": { th: "ยืนยันการลบร้านค้า", en: "Confirm Delete Shop", ja: "お店の削除を確認", zh: "确认删除商店", ko: "상점 삭제 확인", ru: "Подтвердите удаление" },
   "profile.confirmDeleteShopDesc": { th: "คุณแน่ใจหรือไม่ว่าต้องการลบร้านค้านี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้", en: "Are you sure you want to delete this shop? This action cannot be undone.", ja: "このお店を削除してもよろしいですか？この操作は取り消せません。", zh: "您确定要删除此商店吗？此操作无法撤消。", ko: "이 상점을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.", ru: "Вы уверены? Это действие нельзя отменить." },

   // GroupChat menu
   "groupChat.checkedInToday": { th: "เช็คอินแล้ววันนี้", en: "Checked in today", ja: "本日チェックイン済み", zh: "今日已签到", ko: "오늘 체크인 완료", ru: "Уже отмечено сегодня" },
   "groupChat.checkin": { th: "เช็คอิน", en: "Check in", ja: "チェックイン", zh: "签到", ko: "체크인", ru: "Отметиться" },
   "groupChat.muteNotif": { th: "ปิดการแจ้งเตือน", en: "Mute notifications", ja: "通知をミュート", zh: "关闭通知", ko: "알림 끄기", ru: "Отключить уведомления" },
   "groupChat.unmuteNotif": { th: "เปิดการแจ้งเตือน", en: "Unmute notifications", ja: "通知をオン", zh: "开启通知", ko: "알림 켜기", ru: "Включить уведомления" },
   "groupChat.mutedToast": { th: "ปิดการแจ้งเตือนกลุ่มนี้แล้ว", en: "Group notifications muted", ja: "グループ通知をミュートしました", zh: "已关闭群组通知", ko: "그룹 알림이 꺼졌습니다", ru: "Уведомления группы отключены" },
   "groupChat.unmutedToast": { th: "เปิดการแจ้งเตือนกลุ่มนี้แล้ว", en: "Group notifications unmuted", ja: "グループ通知をオンにしました", zh: "已开启群组通知", ko: "그룹 알림이 켜졌습니다", ru: "Уведомления группы включены" },
   "groupChat.viewMembers": { th: "ดูสมาชิก", en: "View Members", ja: "メンバーを表示", zh: "查看成员", ko: "멤버 보기", ru: "Участники" },
   "groupChat.leaveChat": { th: "ออกจากแชท", en: "Leave Chat", ja: "チャットを退出", zh: "退出聊天", ko: "채팅 나가기", ru: "Покинуть чат" },
   "groupChat.leaving": { th: "กำลังออก...", en: "Leaving...", ja: "退出中...", zh: "退出中...", ko: "나가는 중...", ru: "Выход..." },
   "groupChat.leftToast": { th: "ออกจากกลุ่มแชทแล้ว", en: "Left group chat", ja: "グループチャットを退出しました", zh: "已退出群聊", ko: "그룹 채팅을 나갔습니다", ru: "Вы покинули чат" },
   "groupChat.leaveError": { th: "เกิดข้อผิดพลาดในการออกจากกลุ่ม", en: "Error leaving group", ja: "グループ退出エラー", zh: "退出群组出错", ko: "그룹 나가기 오류", ru: "Ошибка выхода из группы" },
   "groupChat.kickedToast": { th: "คุณถูกเตะออกจากกลุ่มนี้แล้ว", en: "You were kicked from this group", ja: "グループから追放されました", zh: "您已被踢出此群组", ko: "그룹에서 추방되었습니다", ru: "Вас исключили из группы" },
   "groupChat.checkinSuccess": { th: "เช็คอินสำเร็จ! ได้รับ 10 EXP", en: "Check-in successful! +10 EXP", ja: "チェックイン成功！+10 EXP", zh: "签到成功！+10 EXP", ko: "체크인 성공! +10 EXP", ru: "Отметка успешна! +10 EXP" },
   "groupChat.checkinSuccessDesc": { th: "คุณสามารถเช็คอินได้อีกครั้งในวันพรุ่งนี้", en: "You can check in again tomorrow", ja: "明日もう一度チェックインできます", zh: "明天可以再次签到", ko: "내일 다시 체크인할 수 있습니다", ru: "Следующая отметка завтра" },
   "groupChat.alreadyCheckedIn": { th: "คุณเช็คอินวันนี้แล้ว", en: "Already checked in today", ja: "本日チェックイン済みです", zh: "今天已经签到了", ko: "오늘 이미 체크인했습니다", ru: "Уже отмечено сегодня" },
   "groupChat.checkinError": { th: "เกิดข้อผิดพลาดในการเช็คอิน", en: "Error checking in", ja: "チェックインエラー", zh: "签到出错", ko: "체크인 오류", ru: "Ошибка чекина" },
   "groupChat.startConversation": { th: "เริ่มสนทนากับสมาชิกในกลุ่ม", en: "Start a conversation with group members", ja: "グループメンバーと会話を始めましょう", zh: "开始与群成员对话", ko: "그룹 멤버와 대화를 시작하세요", ru: "Начните разговор с участниками группы" },

   // DirectChat
   "directChat.noMessages": { th: "ยังไม่มีข้อความ", en: "No messages yet", ja: "メッセージはまだありません", zh: "暂无消息", ko: "메시지가 없습니다", ru: "Сообщений нет" },
   "directChat.startChat": { th: "เริ่มสนทนากับ", en: "Start a conversation with", ja: "会話を始めましょう：", zh: "开始与", ko: "대화를 시작하세요:", ru: "Начните разговор с" },
   "chat.placeholder": { th: "พิมพ์ข้อความ...", en: "Type a message...", ja: "メッセージを入力...", zh: "输入消息...", ko: "메시지 입력...", ru: "Введите сообщение..." },
   "chat.recording": { th: "กำลังอัดเสียง", en: "Recording", ja: "録音中", zh: "录音中", ko: "녹음 중", ru: "Запись" },
   "chat.replyingTo": { th: "ตอบกลับ:", en: "Replying to:", ja: "返信先:", zh: "回复:", ko: "답장:", ru: "Ответ на:" },
   "chat.addCaption": { th: "เพิ่มข้อความ...", en: "Add a caption...", ja: "キャプションを追加...", zh: "添加说明...", ko: "캡션 추가...", ru: "Добавить подпись..." },
   "directChat.dmMutedToast": { th: "ปิดการแจ้งเตือนแชทนี้แล้ว", en: "Chat notifications muted", ja: "チャット通知をミュートしました", zh: "已关闭聊天通知", ko: "채팅 알림이 꺼졌습니다", ru: "Уведомления чата отключены" },
   "directChat.dmUnmutedToast": { th: "เปิดการแจ้งเตือนแชทนี้แล้ว", en: "Chat notifications unmuted", ja: "チャット通知をオンにしました", zh: "已开启聊天通知", ko: "채팅 알림이 켜졌습니다", ru: "Уведомления чата включены" },
   "directChat.reportUser": { th: "รายงานผู้ใช้นี้", en: "Report User", ja: "ユーザーを報告", zh: "举报用户", ko: "사용자 신고", ru: "Пожаловаться" },
   "directChat.blockUser": { th: "บล็อกผู้ใช้นี้", en: "Block User", ja: "ユーザーをブロック", zh: "屏蔽用户", ko: "사용자 차단", ru: "Заблокировать" },
   "directChat.youBlockedUser": { th: "คุณบล็อกผู้ใช้รายนี้อยู่", en: "You have blocked this user", ja: "このユーザーをブロックしています", zh: "您已屏蔽此用户", ko: "이 사용자를 차단했습니다", ru: "Вы заблокировали пользователя" },
   "directChat.blockConfirmTitle": { th: "บล็อก", en: "Block", ja: "ブロック", zh: "屏蔽", ko: "차단", ru: "Заблокировать" },
   "directChat.alreadyBlocked": { th: "ผู้ใช้นี้ถูกบล็อกอยู่แล้ว", en: "User already blocked", ja: "既にブロック済みです", zh: "该用户已被屏蔽", ko: "이미 차단된 사용자입니다", ru: "Пользователь уже заблокирован" },

   // GroupMembersDialog
   "members.title": { th: "สมาชิกในกลุ่ม", en: "Group Members", ja: "グループメンバー", zh: "群成员", ko: "그룹 멤버", ru: "Участники группы" },
   "members.membersLabel": { th: "สมาชิก", en: "members", ja: "メンバー", zh: "成员", ko: "멤버", ru: "участников" },
   "members.noMembers": { th: "ไม่พบสมาชิก", en: "No members found", ja: "メンバーが見つかりません", zh: "未找到成员", ko: "멤버를 찾을 수 없습니다", ru: "Участники не найдены" },
   "members.joinedAt": { th: "เข้าร่วมเมื่อ", en: "Joined", ja: "参加日", zh: "加入于", ko: "가입일", ru: "Вступил" },
   "members.owner": { th: "เจ้าของ", en: "Owner", ja: "オーナー", zh: "群主", ko: "방장", ru: "Владелец" },
   "members.kickSuccess": { th: "เตะสมาชิกออกจากกลุ่มแล้ว", en: "Member kicked from group", ja: "メンバーを追放しました", zh: "已将成员踢出群组", ko: "멤버가 추방되었습니다", ru: "Участник исключен" },
   "members.kickError": { th: "เกิดข้อผิดพลาดในการเตะสมาชิก", en: "Error kicking member", ja: "メンバーの追放に失敗しました", zh: "踢出成员出错", ko: "멤버 추방 오류", ru: "Ошибка исключения" },

   // ReelShareSheet
   "share.title": { th: "แชร์ไปยัง", en: "Share to", ja: "共有先", zh: "分享至", ko: "공유하기", ru: "Поделиться" },
   "share.share": { th: "แชร์", en: "Share", ja: "共有", zh: "分享", ko: "공유", ru: "Поделиться" },
   "share.searchUsers": { th: "ค้นหาผู้ใช้...", en: "Search users...", ja: "ユーザーを検索...", zh: "搜索用户...", ko: "사용자 검색...", ru: "Найти пользователя..." },
   "share.sending": { th: "กำลังส่ง...", en: "Sending...", ja: "送信中...", zh: "发送中...", ko: "보내는 중...", ru: "Отправка..." },
   "share.sent": { th: "ส่งแล้ว!", en: "Sent!", ja: "送信しました！", zh: "已发送！", ko: "전송됨!", ru: "Отправлено!" },
   "share.sendError": { th: "ส่งไม่สำเร็จ", en: "Failed to send", ja: "送信に失敗しました", zh: "发送失败", ko: "전송 실패", ru: "Ошибка отправки" },
   "share.copied": { th: "คัดลอกลิงก์แล้ว", en: "Link copied", ja: "リンクをコピーしました", zh: "链接已复制", ko: "링크 복사됨", ru: "Ссылка скопирована" },
   "share.shareReel": { th: "แชร์คลิปนี้", en: "Share this clip", ja: "このクリップを共有", zh: "分享此视频", ko: "이 클립 공유", ru: "Поделиться клипом" },
   "share.checkReel": { th: "ดู Reel นี้สิ!", en: "Check out this Reel!", ja: "このリールを見て！", zh: "看看这个短视频！", ko: "이 릴스를 확인해보세요!", ru: "Посмотри этот Reel!" },

   // ReportUserSheet
   "report.title": { th: "รายงาน", en: "Report", ja: "報告", zh: "举报", ko: "신고", ru: "Жалоба" },
   "report.selectProblem": { th: "เลือกปัญหาที่จะรายงาน", en: "Select a problem to report", ja: "報告する問題を選択", zh: "选择要举报的问题", ko: "신고할 문제를 선택하세요", ru: "Выберите проблему" },
   "report.userDesc": { th: "คุณสามารถรายงานผู้ใช้ได้หากคุณคิดว่าขัดต่อมาตรฐานชุมชนของเรา", en: "You can report this user if you think they violate our community standards", ja: "コミュニティ基準に違反していると思われる場合は報告できます", zh: "如果您认为该用户违反了我们的社区标准，可以举报", ko: "커뮤니티 기준을 위반한다고 생각되면 신고할 수 있습니다", ru: "Вы можете пожаловаться, если пользователь нарушает правила" },
   "report.reelDesc": { th: "หากคุณเห็นเนื้อหาที่ไม่เหมาะสม กรุณาแจ้งให้เราทราบ", en: "If you see inappropriate content, please let us know", ja: "不適切なコンテンツがあればお知らせください", zh: "如果您看到不当内容，请告知我们", ko: "부적절한 콘텐츠를 발견하면 알려주세요", ru: "Если вы видите неподходящий контент, сообщите нам" },
   "report.enterDetail": { th: "กรุณาระบุรายละเอียด", en: "Please provide details", ja: "詳細を入力してください", zh: "请提供详情", ko: "세부 사항을 입력해주세요", ru: "Укажите подробности" },
   "report.detailPlaceholder": { th: "อธิบายเหตุผลที่ต้องการรายงาน...", en: "Describe why you want to report...", ja: "報告理由を入力...", zh: "描述举报原因...", ko: "신고 사유를 설명해주세요...", ru: "Опишите причину жалобы..." },
   "report.back": { th: "ย้อนกลับ", en: "Back", ja: "戻る", zh: "返回", ko: "뒤로", ru: "Назад" },
   "report.send": { th: "ส่ง", en: "Submit", ja: "送信", zh: "提交", ko: "제출", ru: "Отправить" },
   "report.success": { th: "รายงานสำเร็จ", en: "Report submitted", ja: "報告しました", zh: "举报成功", ko: "신고 완료", ru: "Жалоба отправлена" },
   "report.successDesc": { th: "ขอบคุณสำหรับการรายงาน เราจะตรวจสอบโดยเร็วที่สุด", en: "Thank you for your report. We'll review it shortly.", ja: "ご報告ありがとうございます。速やかに確認します。", zh: "感谢您的举报，我们会尽快审核。", ko: "신고해 주셔서 감사합니다. 빠르게 검토하겠습니다.", ru: "Спасибо за жалобу. Мы рассмотрим её." },
   "report.alreadyReportedUser": { th: "คุณได้รายงานผู้ใช้นี้ไปแล้ว", en: "You have already reported this user", ja: "既にこのユーザーを報告済みです", zh: "您已经举报过此用户", ko: "이미 이 사용자를 신고했습니다", ru: "Вы уже отправляли жалобу" },
   "report.alreadyReportedReel": { th: "คุณได้รายงานคลิปนี้ไปแล้ว", en: "You have already reported this clip", ja: "既にこのクリップを報告済みです", zh: "您已经举报过此视频", ko: "이미 이 클립을 신고했습니다", ru: "Вы уже жаловались на этот клип" },
   "report.successReel": { th: "รายงานสำเร็จ", en: "Report submitted", ja: "報告しました", zh: "举报成功", ko: "신고 완료", ru: "Жалоба отправлена" },
   "report.successReelDesc": { th: "ขอบคุณสำหรับการรายงาน", en: "Thank you for your report", ja: "ご報告ありがとうございます", zh: "感谢您的举报", ko: "신고해 주셔서 감사합니다", ru: "Спасибо за жалобу" },

   // Report reasons - User
   "report.reason.sexual": { th: "เนื้อหาละเมิดความเหมาะสมทางเพศ", en: "Sexual or inappropriate content", ja: "性的または不適切なコンテンツ", zh: "色情或不当内容", ko: "성적 또는 부적절한 콘텐츠", ru: "Сексуальный или неуместный контент" },
   "report.reason.harassment": { th: "การข่มขู่ คุกคาม หรือกลั่นแกล้ง", en: "Threats, harassment, or bullying", ja: "脅迫・嫌がらせ・いじめ", zh: "威胁、骚扰或欺凌", ko: "위협, 괴롭힘 또는 따돌림", ru: "Угрозы, преследование или буллинг" },
   "report.reason.impersonation": { th: "พฤติกรรมหลอกลวงหรือการแอบอ้าง", en: "Deception or impersonation", ja: "なりすましや詐欺行為", zh: "欺骗或冒充他人", ko: "사기 또는 사칭", ru: "Обман или выдача себя за другого" },
   "report.reason.misinformation": { th: "ข้อมูลที่อาจสร้างความเข้าใจผิด", en: "Potentially misleading information", ja: "誤解を招く可能性のある情報", zh: "可能具有误导性的信息", ko: "오해를 유발할 수 있는 정보", ru: "Потенциально ложная информация" },
   "report.reason.violence": { th: "กิจกรรมที่เกี่ยวข้องกับความรุนแรง", en: "Violence-related activity", ja: "暴力に関連する活動", zh: "与暴力相关的活动", ko: "폭력 관련 활동", ru: "Деятельность связанная с насилием" },
   "report.reason.spam": { th: "เนื้อหาเชิงโฆษณาหรือสแปม", en: "Advertising or spam", ja: "広告またはスパム", zh: "广告或垃圾信息", ko: "광고 또는 스팸", ru: "Реклама или спам" },
   "report.reason.other": { th: "ประเด็นอื่นที่ต้องการแจ้งทีมงาน", en: "Other issue to report", ja: "その他の報告事項", zh: "其他需要报告的问题", ko: "기타 신고 사항", ru: "Другая проблема" },

   // Report reasons - Reel
   "report.reel.inappropriate": { th: "เนื้อหามีภาพหรือข้อความไม่เหมาะสม", en: "Inappropriate images or text", ja: "不適切な画像またはテキスト", zh: "含不当图片或文字", ko: "부적절한 이미지 또는 텍스트", ru: "Неподходящие изображения или текст" },
   "report.reel.harassment": { th: "มีการโจมตีหรือคุกคามบุคคลอื่น", en: "Attacking or harassing others", ja: "他者への攻撃や嫌がらせ", zh: "攻击或骚扰他人", ko: "타인 공격 또는 괴롭힘", ru: "Нападки или преследование" },
   "report.reel.impersonation": { th: "มีการสวมรอยหรือใช้ข้อมูลผู้อื่นโดยไม่ได้รับอนุญาต", en: "Impersonation or unauthorized use of identity", ja: "なりすましや個人情報の不正利用", zh: "冒充或未经授权使用他人信息", ko: "사칭 또는 무단 신원 사용", ru: "Выдача себя за другого" },
   "report.reel.scam": { th: "มีลักษณะชักชวนหลอกลวง", en: "Appears to be a scam", ja: "詐欺の疑い", zh: "疑似诈骗", ko: "사기로 보임", ru: "Похоже на мошенничество" },
   "report.reel.spam": { th: "มีพฤติกรรมส่งข้อความรบกวนซ้ำ ๆ", en: "Repetitive spam messages", ja: "繰り返しのスパムメッセージ", zh: "重复发送垃圾信息", ko: "반복적인 스팸 메시지", ru: "Повторяющийся спам" },
   "report.reel.illegal": { th: "เนื้อหาอาจผิดกฎหมายหรือขัดต่อนโยบาย", en: "May violate laws or policies", ja: "法律やポリシーに違反する可能性", zh: "可能违反法律或政策", ko: "법률 또는 정책 위반 가능성", ru: "Может нарушать закон или правила" },
   "report.reel.other": { th: "อื่น ๆ", en: "Other", ja: "その他", zh: "其他", ko: "기타", ru: "Другое" },

   // Onboarding
   "onboarding.title": { th: "ยินดีต้อนรับ!", en: "Welcome!", ja: "ようこそ！", zh: "欢迎！", ko: "환영합니다!", ru: "Добро пожаловать!" },
   "onboarding.subtitle": { th: "เลือกภาษาและประเทศของคุณเพื่อเริ่มต้นใช้งาน", en: "Choose your language and country to get started", ja: "言語と国を選択して始めましょう", zh: "选择您的语言和国家以开始", ko: "시작하려면 언어와 국가를 선택하세요", ru: "Выберите язык и страну для начала" },
   "onboarding.confirm": { th: "เริ่มต้นใช้งาน", en: "Get Started", ja: "始める", zh: "开始使用", ko: "시작하기", ru: "Начать" },

   // Common / shared
   "common.save": { th: "บันทึก", en: "Save", ja: "保存", zh: "保存", ko: "저장", ru: "Сохранить" },
   "common.approve": { th: "อนุมัติ", en: "Approve", ja: "承認", zh: "批准", ko: "승인", ru: "Одобрить" },
   "common.reject": { th: "ปฏิเสธ", en: "Reject", ja: "拒否", zh: "拒绝", ko: "거절", ru: "Отклонить" },
   "common.error": { th: "เกิดข้อผิดพลาด", en: "An error occurred", ja: "エラーが発生しました", zh: "发生错误", ko: "오류 발생", ru: "Произошла ошибка" },
   "common.tryAgain": { th: "กรุณาลองใหม่อีกครั้ง", en: "Please try again", ja: "もう一度お試しください", zh: "请重试", ko: "다시 시도해주세요", ru: "Пожалуйста, попробуйте ещё раз" },
   "common.loading": { th: "กำลังโหลด...", en: "Loading...", ja: "読み込み中...", zh: "加载中...", ko: "로딩 중...", ru: "Загрузка..." },
   "common.processing": { th: "กำลังดำเนินการ...", en: "Processing...", ja: "処理中...", zh: "处理中...", ko: "처리 중...", ru: "Обработка..." },
   "common.unknownUser": { th: "ผู้ใช้", en: "User", ja: "ユーザー", zh: "用户", ko: "사용자", ru: "Пользователь" },
   "common.report": { th: "รายงาน", en: "Report", ja: "報告", zh: "举报", ko: "신고", ru: "Пожаловаться" },
   "common.sendMessage": { th: "ส่งข้อความ", en: "Send Message", ja: "メッセージを送る", zh: "发送消息", ko: "메시지 보내기", ru: "Отправить сообщение" },
   "common.confirmDelete": { th: "ยืนยันการลบ", en: "Confirm Delete", ja: "削除を確認", zh: "确认删除", ko: "삭제 확인", ru: "Подтвердить удаление" },
   "common.cannotUndo": { th: "การกระทำนี้ไม่สามารถย้อนกลับได้", en: "This action cannot be undone", ja: "この操作は元に戻せません", zh: "此操作无法撤销", ko: "이 작업은 되돌릴 수 없습니다", ru: "Это действие необратимо" },
   "common.none": { th: "ไม่แสดง", en: "None", ja: "なし", zh: "无", ko: "없음", ru: "Нет" },
   "common.replying": { th: "ตอบกลับ", en: "Reply", ja: "返信", zh: "回复", ko: "답장", ru: "Ответить" },
   "common.deleteMessage": { th: "ลบข้อความ", en: "Delete Message", ja: "メッセージを削除", zh: "删除消息", ko: "메시지 삭제", ru: "Удалить сообщение" },
   "common.deletedMessage": { th: "ข้อความนี้ถูกลบแล้ว", en: "This message was deleted", ja: "このメッセージは削除されました", zh: "该消息已被删除", ko: "이 메시지는 삭제되었습니다", ru: "Сообщение удалено" },
   "common.you": { th: "คุณ", en: "You", ja: "あなた", zh: "你", ko: "나", ru: "Вы" },
   "chat.image": { th: "รูปภาพ", en: "Image", ja: "画像", zh: "图片", ko: "이미지", ru: "Изображение" },
   "chat.audio": { th: "เสียง", en: "Audio", ja: "音声", zh: "音频", ko: "오디오", ru: "Аудио" },
   "chat.message": { th: "ข้อความ", en: "Message", ja: "メッセージ", zh: "消息", ko: "메시지", ru: "Сообщение" },
   "chat.deleteError": { th: "ลบข้อความไม่ได้:", en: "Could not delete message:", ja: "メッセージを削除できません:", zh: "无法删除消息:", ko: "메시지 삭제 불가:", ru: "Не удалось удалить сообщение:" },
   "directChat.blockSuccess": { th: "บล็อก {name} แล้ว", en: "Blocked {name}", ja: "{name}をブロックしました", zh: "已屏蔽{name}", ko: "{name}을(를) 차단했습니다", ru: "{name} заблокирован" },
   "groupChat.defaultTitle": { th: "กลุ่มกิจกรรม", en: "Activity Group", ja: "アクティビティグループ", zh: "活动群组", ko: "활동 그룹", ru: "Группа активностей" },

   // Auth page
   "auth.welcome": { th: "ยินดีต้อนรับ", en: "Welcome", ja: "ようこそ", zh: "欢迎", ko: "환영합니다", ru: "Добро пожаловать" },
   "auth.login": { th: "เข้าสู่ระบบ", en: "Sign In", ja: "ログイン", zh: "登录", ko: "로그인", ru: "Войти" },
   "auth.register": { th: "สมัครสมาชิก", en: "Sign Up", ja: "新規登録", zh: "注册", ko: "회원가입", ru: "Регистрация" },
   "auth.email": { th: "อีเมล", en: "Email", ja: "メール", zh: "邮箱", ko: "이메일", ru: "Эл. почта" },
   "auth.password": { th: "รหัสผ่าน", en: "Password", ja: "パスワード", zh: "密码", ko: "비밀번호", ru: "Пароль" },
   "auth.displayName": { th: "ชื่อที่แสดง", en: "Display Name", ja: "表示名", zh: "显示名称", ko: "표시 이름", ru: "Отображаемое имя" },
   "auth.displayNamePlaceholder": { th: "ชื่อของคุณ", en: "Your name", ja: "あなたの名前", zh: "你的名字", ko: "이름", ru: "Ваше имя" },
   "auth.passwordMin": { th: "อย่างน้อย 6 ตัวอักษร", en: "At least 6 characters", ja: "6文字以上", zh: "至少6个字符", ko: "최소 6자", ru: "Минимум 6 символов" },
   "auth.forgotPassword": { th: "ลืมรหัสผ่าน?", en: "Forgot password?", ja: "パスワードを忘れましたか？", zh: "忘记密码？", ko: "비밀번호 찾기", ru: "Забыли пароль?" },
   "auth.loginLoading": { th: "กำลังเข้าสู่ระบบ...", en: "Signing in...", ja: "ログイン中...", zh: "登录中...", ko: "로그인 중...", ru: "Вход..." },
   "auth.registerLoading": { th: "กำลังสมัครสมาชิก...", en: "Signing up...", ja: "登録中...", zh: "注册中...", ko: "가입 중...", ru: "Регистрация..." },
   "auth.oauthLoading": { th: "กำลังดำเนินการ...", en: "Processing...", ja: "処理中...", zh: "处理中...", ko: "처리 중...", ru: "Обработка..." },
   "auth.orDivider": { th: "หรือ", en: "or", ja: "または", zh: "或", ko: "또는", ru: "или" },
   "auth.loginWithGoogle": { th: "เข้าสู่ระบบด้วย Google", en: "Sign in with Google", ja: "Googleでログイン", zh: "使用 Google 登录", ko: "Google로 로그인", ru: "Войти через Google" },
   "auth.loginWithFacebook": { th: "เข้าสู่ระบบด้วย Facebook", en: "Sign in with Facebook", ja: "Facebookでログイン", zh: "使用 Facebook 登录", ko: "Facebook으로 로그인", ru: "Войти через Facebook" },
   "auth.terms": { th: "โดยการดำเนินการต่อ แสดงว่าคุณยอมรับ", en: "By continuing, you agree to our", ja: "続行することで、当社の", zh: "继续即表示您同意我们的", ko: "계속 진행함으로써 동의합니다", ru: "Продолжая, вы принимаете наши" },
   "auth.termsLink": { th: "เงื่อนไขการใช้บริการ", en: "Terms of Service", ja: "利用規約", zh: "服务条款", ko: "이용약관", ru: "Условия использования" },
   "auth.privacyAnd": { th: "และรับรองว่าคุณได้อ่าน", en: "and confirm you have read our", ja: "に同意し、当社の", zh: "并确认您已阅读我们的", ko: "및 읽었음을 확인합니다", ru: "и подтверждаете, что прочитали" },
   "auth.privacyLink": { th: "นโยบายความเป็นส่วนตัว", en: "Privacy Policy", ja: "プライバシーポリシー", zh: "隐私政策", ko: "개인정보 처리방침", ru: "Политику конфиденциальности" },
   "auth.loginSuccess": { th: "เข้าสู่ระบบสำเร็จ", en: "Signed in successfully", ja: "ログイン成功", zh: "登录成功", ko: "로그인 성공", ru: "Вход выполнен" },
   "auth.welcomeBack": { th: "ยินดีต้อนรับกลับมา!", en: "Welcome back!", ja: "おかえりなさい！", zh: "欢迎回来！", ko: "다시 오셨군요!", ru: "С возвращением!" },
   "auth.registerSuccess": { th: "สมัครสมาชิกสำเร็จ", en: "Registration successful", ja: "登録成功", zh: "注册成功", ko: "가입 성공", ru: "Регистрация успешна" },
   "auth.checkEmail": { th: "กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี", en: "Please check your email to verify your account", ja: "アカウント確認のためメールをご確認ください", zh: "请检查您的邮箱以验证账户", ko: "이메일을 확인하여 계정을 인증하세요", ru: "Проверьте почту для подтверждения аккаунта" },
   "auth.forgotPasswordTitle": { th: "ลืมรหัสผ่าน", en: "Forgot Password", ja: "パスワードを忘れた", zh: "忘记密码", ko: "비밀번호 찾기", ru: "Забыли пароль" },
   "auth.forgotPasswordDesc": { th: "กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ", en: "Enter the email you registered with. We will send you a password reset link.", ja: "登録したメールアドレスを入力してください。パスワードリセットリンクをお送りします。", zh: "输入您注册时使用的邮箱，我们将发送密码重置链接。", ko: "가입 시 사용한 이메일을 입력하세요. 비밀번호 재설정 링크를 보내드립니다.", ru: "Введите email при регистрации. Мы отправим ссылку для сброса пароля." },
   "auth.sendLink": { th: "ส่งลิงก์", en: "Send Link", ja: "リンクを送る", zh: "发送链接", ko: "링크 전송", ru: "Отправить ссылку" },
   "auth.sendLinkLoading": { th: "กำลังส่ง...", en: "Sending...", ja: "送信中...", zh: "发送中...", ko: "전송 중...", ru: "Отправка..." },
   "auth.resetLinkSent": { th: "ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว", en: "Password reset link sent", ja: "パスワードリセットリンクを送信しました", zh: "密码重置链接已发送", ko: "비밀번호 재설정 링크 전송됨", ru: "Ссылка для сброса пароля отправлена" },
   "auth.checkEmailForReset": { th: "กรุณาตรวจสอบอีเมลของคุณ", en: "Please check your email", ja: "メールをご確認ください", zh: "请检查您的邮箱", ko: "이메일을 확인하세요", ru: "Проверьте вашу почту" },
   "auth.enterEmail": { th: "กรุณากรอกอีเมล", en: "Please enter your email", ja: "メールアドレスを入力してください", zh: "请输入邮箱", ko: "이메일을 입력하세요", ru: "Введите email" },
   "auth.enterEmailHint": { th: "ใส่อีเมลที่ใช้สมัครสมาชิก", en: "Enter the email you registered with", ja: "登録したメールアドレスを入力", zh: "输入您注册时使用的邮箱", ko: "가입 시 사용한 이메일 입력", ru: "Введите email при регистрации" },
   "auth.suspendedTitle": { th: "บัญชีของคุณถูกระงับอยู่", en: "Your account is suspended", ja: "アカウントが停止されています", zh: "您的账户已被暂停", ko: "계정이 정지되었습니다", ru: "Ваш аккаунт приостановлен" },
   "auth.suspendedDesc": { th: "คุณต้องการกลับมาใช้งานบัญชีนี้อีกครั้งใช่หรือไม่?", en: "Do you want to reactivate this account?", ja: "このアカウントを再開しますか？", zh: "您要重新激活此账户吗？", ko: "이 계정을 다시 활성화하시겠습니까?", ru: "Хотите восстановить аккаунт?" },
   "auth.reactivateAccount": { th: "เปิดใช้งานบัญชี", en: "Reactivate Account", ja: "アカウントを再開", zh: "重新激活账户", ko: "계정 활성화", ru: "Восстановить аккаунт" },
   "auth.reactivateSuccess": { th: "เปิดใช้งานบัญชีสำเร็จ", en: "Account reactivated", ja: "アカウントを再開しました", zh: "账户已重新激活", ko: "계정이 활성화되었습니다", ru: "Аккаунт восстановлен" },
   "auth.cannotReactivate": { th: "ไม่สามารถเปิดใช้งานบัญชีได้ กรุณาลองใหม่อีกครั้ง", en: "Cannot reactivate account. Please try again.", ja: "アカウントを再開できません。再度お試しください。", zh: "无法重新激活账户，请重试。", ko: "계정을 활성화할 수 없습니다. 다시 시도해주세요.", ru: "Не удалось восстановить аккаунт. Попробуйте ещё раз." },
   "auth.accountSuspendedTitle": { th: "บัญชีถูกระงับ", en: "Account Suspended", ja: "アカウント停止", zh: "账户已暂停", ko: "계정 정지", ru: "Аккаунт приостановлен" },
   "auth.accountSuspendedDesc": { th: "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ", en: "Your account has been suspended. Please contact admin.", ja: "アカウントが停止されました。管理者にお問い合わせください。", zh: "您的账户已被暂停，请联系管理员。", ko: "계정이 정지되었습니다. 관리자에게 문의하세요.", ru: "Аккаунт приостановлен. Обратитесь к администратору." },
   "auth.loginFailedTitle": { th: "เข้าสู่ระบบไม่สำเร็จ", en: "Login Failed", ja: "ログイン失敗", zh: "登录失败", ko: "로그인 실패", ru: "Ошибка входа" },
   "auth.loginFailedDesc": { th: "ไม่สามารถยืนยันตัวตนได้ กรุณาลองใหม่อีกครั้ง", en: "Authentication failed. Please try again.", ja: "認証に失敗しました。再度お試しください。", zh: "身份验证失败，请重试。", ko: "인증에 실패했습니다. 다시 시도해주세요.", ru: "Ошибка аутентификации. Попробуйте снова." },
   "auth.signingIn": { th: "กำลังเข้าสู่ระบบ...", en: "Signing in...", ja: "ログイン中...", zh: "正在登录...", ko: "로그인 중...", ru: "Вход..." },
   "auth.openAppDesc": { th: "เปิดแอป Levelon ต่อได้เลย", en: "You can open the Levelon app now", ja: "Levelonアプリを開いてください", zh: "您可以打开 Levelon 应用了", ko: "Levelon 앱을 열 수 있습니다", ru: "Вы можете открыть приложение Levelon" },
   "auth.openApp": { th: "เปิดแอป Levelon", en: "Open Levelon App", ja: "Levelonアプリを開く", zh: "打开 Levelon 应用", ko: "Levelon 앱 열기", ru: "Открыть приложение" },
   "auth.useWeb": { th: "ใช้บนเว็บแทน", en: "Use web instead", ja: "ウェブを使用する", zh: "改用网页版", ko: "웹 사용", ru: "Использовать веб-версию" },
   "resetPassword.title": { th: "ตั้งรหัสผ่านใหม่", en: "Set New Password", ja: "新しいパスワードを設定", zh: "设置新密码", ko: "새 비밀번호 설정", ru: "Установить новый пароль" },
   "resetPassword.subtitle": { th: "กรุณากรอกรหัสผ่านใหม่ของคุณ", en: "Please enter your new password", ja: "新しいパスワードを入力してください", zh: "请输入新密码", ko: "새 비밀번호를 입력하세요", ru: "Введите новый пароль" },
   "resetPassword.invalidLink": { th: "ลิงก์ไม่ถูกต้อง", en: "Invalid Link", ja: "無効なリンク", zh: "无效链接", ko: "잘못된 링크", ru: "Недействительная ссылка" },
   "resetPassword.invalidLinkDesc": { th: "กรุณาใช้ลิงก์รีเซ็ตรหัสผ่านที่ส่งไปยังอีเมลของคุณ", en: "Please use the password reset link sent to your email", ja: "メールに送信されたパスワードリセットリンクを使用してください", zh: "请使用发送到邮箱的密码重置链接", ko: "이메일로 전송된 비밀번호 재설정 링크를 사용하세요", ru: "Используйте ссылку для сброса из письма" },
   "resetPassword.backToLogin": { th: "กลับไปหน้าเข้าสู่ระบบ", en: "Back to Login", ja: "ログインに戻る", zh: "返回登录", ko: "로그인으로 돌아가기", ru: "Вернуться к входу" },
   "resetPassword.success": { th: "เปลี่ยนรหัสผ่านสำเร็จ", en: "Password Changed", ja: "パスワード変更完了", zh: "密码已更改", ko: "비밀번호 변경됨", ru: "Пароль изменён" },
   "resetPassword.successDesc": { th: "คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว", en: "You can now log in with your new password", ja: "新しいパスワードでログインできます", zh: "您现在可以使用新密码登录", ko: "새 비밀번호로 로그인할 수 있습니다", ru: "Теперь вы можете войти с новым паролем" },

   // Notifications page
   "notifications.title": { th: "การแจ้งเตือน", en: "Notifications", ja: "通知", zh: "通知", ko: "알림", ru: "Уведомления" },
   "notifications.empty": { th: "ยังไม่มีการแจ้งเตือน", en: "No notifications yet", ja: "通知はまだありません", zh: "暂无通知", ko: "알림이 없습니다", ru: "Нет уведомлений" },
   "notif.channelChat": { th: "แชท", en: "Chat", ja: "チャット", zh: "聊天", ko: "채팅", ru: "Чат" },
   "notif.channelChatDesc": { th: "ข้อความส่วนตัว", en: "Private messages", ja: "プライベートメッセージ", zh: "私信", ko: "개인 메시지", ru: "Личные сообщения" },
   "notif.channelGroup": { th: "กลุ่มแชท", en: "Group Chat", ja: "グループチャット", zh: "群聊", ko: "그룹 채팅", ru: "Групповой чат" },
   "notif.channelGroupDesc": { th: "ข้อความในกลุ่มกิจกรรม", en: "Activity group messages", ja: "グループアクティビティメッセージ", zh: "活动群组消息", ko: "활동 그룹 메시지", ru: "Сообщения группы активностей" },
   "notif.channelSocial": { th: "กิจกรรมทางสังคม", en: "Social Activity", ja: "ソーシャルアクティビティ", zh: "社交活动", ko: "소셜 활동", ru: "Социальная активность" },
   "notif.channelSocialDesc": { th: "การติดตาม, ถูกใจ, และความคิดเห็น", en: "Follows, likes, and comments", ja: "フォロー、いいね、コメント", zh: "关注、点赞和评论", ko: "팔로우, 좋아요, 댓글", ru: "Подписки, лайки и комментарии" },
   "notif.sentImage": { th: "📷 ส่งรูปภาพ", en: "📷 Sent an image", ja: "📷 画像を送信", zh: "📷 发送了图片", ko: "📷 이미지 전송", ru: "📷 Отправил изображение" },
   "notif.sentAudio": { th: "🎤 ส่งข้อความเสียง", en: "🎤 Sent a voice message", ja: "🎤 音声メッセージを送信", zh: "🎤 发送了语音消息", ko: "🎤 음성 메시지 전송", ru: "🎤 Отправил голосовое" },
   "notif.groupChat": { th: "กลุ่มแชท", en: "Group Chat", ja: "グループチャット", zh: "群聊", ko: "그룹 채팅", ru: "Групповой чат" },
   "notif.follow": { th: "ได้ติดตามคุณ", en: "started following you", ja: "があなたをフォローしました", zh: "关注了你", ko: "님이 팔로우했습니다", ru: "подписался на вас" },
   "notif.reelLike": { th: "ได้กดถูกใจ Reels ของคุณ", en: "liked your Reel", ja: "があなたのリールにいいねしました", zh: "点赞了你的 Reel", ko: "님이 릴을 좋아합니다", ru: "лайкнул ваш Reel" },
   "notif.reelComment": { th: "ได้แสดงความคิดเห็นใน Reels ของคุณ", en: "commented on your Reel", ja: "があなたのリールにコメントしました", zh: "评论了你的 Reel", ko: "님이 릴에 댓글을 달았습니다", ru: "прокомментировал ваш Reel" },
   "notif.reelPost": { th: "ได้โพสต์ Reels ใหม่", en: "posted a new Reel", ja: "が新しいリールを投稿しました", zh: "发布了新 Reel", ko: "님이 새 릴을 게시했습니다", ru: "опубликовал новый Reel" },

   // Funding bar
   "funding.verifying": { th: "กำลังตรวจสอบการชำระเงิน...", en: "Verifying payment...", ja: "支払いを確認中...", zh: "正在验证支付...", ko: "결제 확인 중...", ru: "Проверка оплаты..." },
   "funding.goalReached": { th: "🎉 เป้าหมายครบแล้ว! รีเซ็ต EXP และเลเวลทั้งหมด", en: "🎉 Goal reached! All EXP and levels reset", ja: "🎉 目標達成！全EXPとレベルをリセット", zh: "🎉 目标达成！所有EXP和等级已重置", ko: "🎉 목표 달성! 모든 EXP와 레벨 초기화", ru: "🎉 Цель достигнута! Весь EXP и уровни сброшены" },
   "funding.alreadyProcessed": { th: "รายการนี้ถูกตรวจสอบแล้ว", en: "Already processed", ja: "既に処理済みです", zh: "已处理", ko: "이미 처리됨", ru: "Уже обработано" },
   "funding.paymentSuccess": { th: "ชำระเงินสำเร็จ! หลอดอัปเดตแล้ว", en: "Payment successful! Bar updated", ja: "支払い成功！バーが更新されました", zh: "支付成功！进度条已更新", ko: "결제 성공! 바 업데이트됨", ru: "Оплата прошла! Полоса обновлена" },
   "funding.paymentPending": { th: "การชำระเงินยังไม่เสร็จสิ้น", en: "Payment not yet complete", ja: "支払いが完了していません", zh: "支付尚未完成", ko: "결제가 아직 완료되지 않음", ru: "Оплата ещё не завершена" },
   "funding.cannotVerify": { th: "ไม่สามารถตรวจสอบการชำระเงินได้", en: "Cannot verify payment", ja: "支払いを確認できません", zh: "无法验证支付", ko: "결제를 확인할 수 없습니다", ru: "Не удалось проверить оплату" },
   "funding.minAmount": { th: "กรุณาระบุจำนวนเงินอย่างน้อย 10 บาท", en: "Please enter at least 10 THB", ja: "10バーツ以上入力してください", zh: "请输入至少10泰铢", ko: "최소 10바트 이상 입력하세요", ru: "Введите минимум 10 бат" },
   "funding.qrError": { th: "เกิดข้อผิดพลาดในการสร้าง QR Code", en: "Error creating QR Code", ja: "QRコードの作成エラー", zh: "创建二维码出错", ko: "QR 코드 생성 오류", ru: "Ошибка создания QR-кода" },
   "funding.decrease": { th: "ลด", en: "Decrease", ja: "減らす", zh: "减少", ko: "감소", ru: "Уменьшить" },
   "funding.increase": { th: "เพิ่ม", en: "Increase", ja: "増やす", zh: "增加", ko: "증가", ru: "Увеличить" },
   "funding.increaseTitle": { th: "💰 เพิ่มแต้ม", en: "💰 Add Points", ja: "💰 ポイントを追加", zh: "💰 增加积分", ko: "💰 포인트 추가", ru: "💰 Добавить баллы" },
   "funding.decreaseTitle": { th: "📉 ลดแต้ม", en: "📉 Remove Points", ja: "📉 ポイントを減らす", zh: "📉 减少积分", ko: "📉 포인트 감소", ru: "📉 Убрать баллы" },
   "funding.increaseDesc": { th: "ระบุจำนวนเงิน (บาท) ที่ต้องการเพิ่มแต้มในหลอด", en: "Enter the amount (THB) to add to the bar", ja: "バーに追加する金額（バーツ）を入力", zh: "输入要添加到进度条的金额（泰铢）", ko: "바에 추가할 금액(바트) 입력", ru: "Введите сумму (бат) для добавления на полосу" },
   "funding.decreaseDesc": { th: "ระบุจำนวนเงิน (บาท) ที่ต้องการลดแต้มในหลอด", en: "Enter the amount (THB) to remove from the bar", ja: "バーから減らす金額（バーツ）を入力", zh: "输入要从进度条中减少的金额（泰铢）", ko: "바에서 줄일 금액(바트) 입력", ru: "Введите сумму (бат) для уменьшения на полосе" },
   "funding.amountPlaceholder": { th: "จำนวนเงิน (ขั้นต่ำ 10 บาท)", en: "Amount (min 10 THB)", ja: "金額（最低10バーツ）", zh: "金额（最低10泰铢）", ko: "금액 (최소 10바트)", ru: "Сумма (мин. 10 бат)" },
   "funding.overLimitError": { th: "ไม่สามารถระบุจำนวนเงินที่มากกว่าแต้มในหลอดขณะนี้ ({n} บาท)", en: "Cannot exceed current bar amount ({n} THB)", ja: "現在のバー残高（{n}バーツ）を超えることはできません", zh: "不能超过当前进度条金额（{n}泰铢）", ko: "현재 바 금액({n}바트)을 초과할 수 없습니다", ru: "Нельзя превысить текущий баланс ({n} бат)" },
   "funding.processingQR": { th: "กำลังสร้าง QR...", en: "Creating QR...", ja: "QR作成中...", zh: "创建二维码中...", ko: "QR 생성 중...", ru: "Создание QR..." },
   "funding.payWithPromptPay": { th: "ชำระเงินผ่าน PromptPay", en: "Pay via PromptPay", ja: "PromptPayで支払う", zh: "通过 PromptPay 支付", ko: "PromptPay로 결제", ru: "Оплатить через PromptPay" },

   // Home / Index page toasts
   "home.groupChatNotFound": { th: "ไม่พบกลุ่มแชทสำหรับกิจกรรมนี้", en: "Group chat not found for this activity", ja: "このアクティビティのグループチャットが見つかりません", zh: "未找到该活动的群聊", ko: "이 활동의 그룹 채팅을 찾을 수 없습니다", ru: "Групповой чат для этого мероприятия не найден" },
   "home.groupChatNotFoundContact": { th: "ไม่พบกลุ่มแชทสำหรับกิจกรรมนี้ กรุณาติดต่อผู้สร้างกิจกรรม", en: "Group chat not found. Please contact the activity creator.", ja: "グループチャットが見つかりません。アクティビティ作成者に連絡してください。", zh: "未找到群聊，请联系活动创建者。", ko: "그룹 채팅을 찾을 수 없습니다. 활동 생성자에게 문의하세요.", ru: "Чат не найден. Обратитесь к создателю мероприятия." },
   "home.alreadyRequested": { th: "คุณได้ส่งคำขอเข้าร่วมแล้ว", en: "You have already sent a join request", ja: "既に参加リクエストを送信しています", zh: "您已发送加入申请", ko: "이미 참여 요청을 보냈습니다", ru: "Вы уже отправили заявку" },
   "home.requestSent": { th: "ส่งคำขอเข้าร่วมแล้ว รอการอนุมัติจากเจ้าของกิจกรรม", en: "Join request sent, waiting for approval", ja: "参加リクエストを送信しました。承認をお待ちください。", zh: "加入申请已发送，等待批准", ko: "참여 요청 전송됨, 승인 대기 중", ru: "Заявка отправлена, ожидайте одобрения" },
   "home.requestError": { th: "เกิดข้อผิดพลาดในการส่งคำขอ", en: "Error sending request", ja: "リクエスト送信エラー", zh: "发送请求时出错", ko: "요청 전송 오류", ru: "Ошибка отправки заявки" },
   "home.joinSuccess": { th: "เข้าร่วมกิจกรรมสำเร็จ!", en: "Joined activity successfully!", ja: "アクティビティに参加しました！", zh: "成功加入活动！", ko: "활동 참여 성공!", ru: "Вы присоединились к мероприятию!" },
   "home.joinError": { th: "เกิดข้อผิดพลาดในการเข้าร่วมกิจกรรม", en: "Error joining activity", ja: "アクティビティへの参加エラー", zh: "加入活动时出错", ko: "활동 참여 오류", ru: "Ошибка при вступлении в мероприятие" },

   // Join requests
   "joinRequests.title": { th: "คำขอเข้าร่วมกิจกรรม", en: "Activity Join Requests", ja: "アクティビティ参加リクエスト", zh: "活动加入申请", ko: "활동 참여 요청", ru: "Заявки на участие" },
   "joinRequests.empty": { th: "ไม่มีคำขอเข้าร่วม", en: "No join requests", ja: "参加リクエストなし", zh: "没有加入申请", ko: "참여 요청 없음", ru: "Нет заявок" },
   "joinRequests.wantsToJoin": { th: "ต้องการเข้าร่วมกิจกรรมของคุณ", en: "wants to join your activity", ja: "があなたのアクティビティに参加したがっています", zh: "想加入你的活动", ko: "님이 활동에 참여하고 싶어합니다", ru: "хочет присоединиться к вашему мероприятию" },
   "joinRequests.approved": { th: "อนุมัติ {name} เข้าร่วมกิจกรรมแล้ว", en: "Approved {name} to join the activity", ja: "{name}のアクティビティ参加を承認しました", zh: "已批准 {name} 加入活动", ko: "{name}의 활동 참여가 승인되었습니다", ru: "Участие {name} одобрено" },
   "joinRequests.approveError": { th: "เกิดข้อผิดพลาดในการอนุมัติ", en: "Error approving request", ja: "承認エラー", zh: "批准时出错", ko: "승인 오류", ru: "Ошибка одобрения" },
   "joinRequests.rejected": { th: "ปฏิเสธคำขอแล้ว", en: "Request rejected", ja: "リクエストを拒否しました", zh: "已拒绝申请", ko: "요청이 거절되었습니다", ru: "Заявка отклонена" },
   "joinRequests.rejectError": { th: "เกิดข้อผิดพลาดในการปฏิเสธ", en: "Error rejecting request", ja: "拒否エラー", zh: "拒绝时出错", ko: "거절 오류", ru: "Ошибка отклонения" },
   "joinRequests.activity": { th: "กิจกรรม", en: "Activity", ja: "アクティビティ", zh: "活动", ko: "활동", ru: "Мероприятие" },

   // Edit Profile
   "editProfile.title": { th: "แก้ไขโปรไฟล์", en: "Edit Profile", ja: "プロフィール編集", zh: "编辑个人资料", ko: "프로필 편집", ru: "Редактировать профиль" },
   "editProfile.clickToChange": { th: "คลิกไอคอนกล้องเพื่อเปลี่ยนรูป", en: "Click the camera icon to change photo", ja: "カメラアイコンをクリックして写真を変更", zh: "点击相机图标更换照片", ko: "카메라 아이콘을 클릭하여 사진 변경", ru: "Нажмите значок камеры для смены фото" },
   "editProfile.displayName": { th: "ชื่อแสดง", en: "Display Name", ja: "表示名", zh: "显示名称", ko: "표시 이름", ru: "Отображаемое имя" },
   "editProfile.displayNamePlaceholder": { th: "ชื่อที่จะแสดงในโปรไฟล์", en: "Name shown on your profile", ja: "プロフィールに表示される名前", zh: "显示在资料中的名字", ko: "프로필에 표시될 이름", ru: "Имя в профиле" },
   "editProfile.bio": { th: "คำอธิบายตนเอง", en: "Bio", ja: "自己紹介", zh: "简介", ko: "소개", ru: "О себе" },
   "editProfile.bioPlaceholder": { th: "แนะนำตัวเองสั้นๆ...", en: "Short introduction...", ja: "簡単な自己紹介...", zh: "简短介绍自己...", ko: "짧은 자기소개...", ru: "Краткое описание..." },
   "editProfile.email": { th: "อีเมล", en: "Email", ja: "メール", zh: "邮箱", ko: "이메일", ru: "Эл. почта" },
   "editProfile.emailPlaceholder": { th: "อีเมลของคุณ", en: "Your email", ja: "あなたのメール", zh: "你的邮箱", ko: "이메일", ru: "Ваш email" },
   "editProfile.emailNote": { th: "อีเมลตามที่สมัคร ไม่สามารถเปลี่ยนได้", en: "Email cannot be changed", ja: "メールは変更できません", zh: "邮箱无法更改", ko: "이메일은 변경할 수 없습니다", ru: "Email нельзя изменить" },
   "editProfile.phone": { th: "เบอร์โทรศัพท์", en: "Phone Number", ja: "電話番号", zh: "电话号码", ko: "전화번호", ru: "Номер телефона" },
   "editProfile.birthday": { th: "วันเกิด", en: "Birthday", ja: "誕生日", zh: "生日", ko: "생일", ru: "День рождения" },
   "editProfile.fileTooLarge": { th: "ไฟล์มีขนาดใหญ่เกินไป (ไม่เกิน 5MB)", en: "File too large (max 5MB)", ja: "ファイルが大きすぎます（最大5MB）", zh: "文件过大（最大5MB）", ko: "파일이 너무 큽니다 (최대 5MB)", ru: "Файл слишком большой (макс. 5 МБ)" },
   "editProfile.unsupportedFormat": { th: "รองรับเฉพาะไฟล์ JPEG, PNG, WebP", en: "Only JPEG, PNG, WebP supported", ja: "JPEG、PNG、WebPのみ対応", zh: "仅支持 JPEG、PNG、WebP", ko: "JPEG, PNG, WebP만 지원", ru: "Поддерживаются только JPEG, PNG, WebP" },
   "editProfile.uploadSuccess": { th: "อัปโหลดรูปโปรไฟล์สำเร็จ", en: "Profile photo uploaded", ja: "プロフィール写真をアップロードしました", zh: "头像上传成功", ko: "프로필 사진 업로드됨", ru: "Фото профиля загружено" },
   "editProfile.uploadError": { th: "อัปโหลดไม่สำเร็จ", en: "Upload failed", ja: "アップロード失敗", zh: "上传失败", ko: "업로드 실패", ru: "Ошибка загрузки" },
   "editProfile.nameRequired": { th: "กรุณากรอกชื่อแสดง", en: "Display name is required", ja: "表示名を入力してください", zh: "请输入显示名称", ko: "표시 이름을 입력해주세요", ru: "Введите отображаемое имя" },
   "editProfile.saveSuccess": { th: "บันทึกโปรไฟล์สำเร็จ", en: "Profile saved", ja: "プロフィールを保存しました", zh: "个人资料已保存", ko: "프로필 저장됨", ru: "Профиль сохранён" },
   "editProfile.saveError": { th: "บันทึกไม่สำเร็จ", en: "Save failed", ja: "保存失敗", zh: "保存失败", ko: "저장 실패", ru: "Ошибка сохранения" },

   // Blocked users
   "blockedUsers.title": { th: "ผู้ใช้ที่บล็อก", en: "Blocked Users", ja: "ブロックしたユーザー", zh: "已屏蔽用户", ko: "차단된 사용자", ru: "Заблокированные" },
   "blockedUsers.empty": { th: "ไม่มีผู้ใช้ที่ถูกบล็อก", en: "No blocked users", ja: "ブロックしたユーザーなし", zh: "没有被屏蔽的用户", ko: "차단된 사용자 없음", ru: "Нет заблокированных" },
   "blockedUsers.unblock": { th: "ปลดบล็อก", en: "Unblock", ja: "ブロック解除", zh: "取消屏蔽", ko: "차단 해제", ru: "Разблокировать" },
   "blockedUsers.unblockSuccess": { th: "ปลดบล็อก {name} แล้ว", en: "Unblocked {name}", ja: "{name}のブロックを解除しました", zh: "已取消屏蔽 {name}", ko: "{name} 차단 해제됨", ru: "{name} разблокирован" },
   "blockedUsers.unblockError": { th: "เกิดข้อผิดพลาด กรุณาลองใหม่", en: "Error, please try again", ja: "エラー、再度お試しください", zh: "出错，请重试", ko: "오류, 다시 시도해주세요", ru: "Ошибка, попробуйте ещё раз" },
   "blockedUsers.deletedUser": { th: "ผู้ใช้ที่ถูกลบ", en: "Deleted user", ja: "削除されたユーザー", zh: "已删除用户", ko: "삭제된 사용자", ru: "Удалённый пользователь" },

   // Reel card
   "reelCard.deleteTitle": { th: "ลบ Reel?", en: "Delete Reel?", ja: "リールを削除しますか？", zh: "删除 Reel？", ko: "릴 삭제?", ru: "Удалить Reel?" },
   "reelCard.deleteDesc": { th: "คุณแน่ใจหรือไม่ว่าต้องการลบ Reel นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้", en: "Are you sure you want to delete this Reel? This action cannot be undone.", ja: "このリールを削除してもよろしいですか？この操作は元に戻せません。", zh: "确定要删除此 Reel 吗？此操作无法撤销。", ko: "이 릴을 삭제하시겠습니까? 되돌릴 수 없습니다.", ru: "Вы уверены, что хотите удалить этот Reel? Это необратимо." },

   // Shop card
   "shopCard.deleteSuccess": { th: "ลบร้านค้าสำเร็จ", en: "Shop deleted", ja: "ショップを削除しました", zh: "店铺已删除", ko: "상점 삭제됨", ru: "Магазин удалён" },
   "shopCard.deleteConfirmTitle": { th: "ยืนยันการลบร้านค้า", en: "Confirm Delete Shop", ja: "ショップの削除を確認", zh: "确认删除店铺", ko: "상점 삭제 확인", ru: "Подтвердить удаление магазина" },
   "shopCard.deleteConfirmDesc": { th: "คุณแน่ใจหรือไม่ว่าต้องการลบร้านค้านี้? การกระทำนี้ไม่สามารถย้อนกลับได้", en: "Are you sure you want to delete this shop? This cannot be undone.", ja: "このショップを削除してもよろしいですか？この操作は元に戻せません。", zh: "确定要删除此店铺吗？无法撤销。", ko: "이 상점을 삭제하시겠습니까? 되돌릴 수 없습니다.", ru: "Удалить этот магазин? Это необратимо." },

   // Check Plus
   "checkPlus.selectActivity": { th: "เลือกกิจกรรมเพื่อเช็คอิน", en: "Select an activity to check in", ja: "チェックインする活動を選択", zh: "选择签到活动", ko: "체크인할 활동 선택", ru: "Выберите активность для отметки" },
   "checkPlus.points": { th: "แต้ม", en: "points", ja: "ポイント", zh: "积分", ko: "포인트", ru: "баллов" },
   "checkPlus.searchActivity": { th: "ค้นหากิจกรรม...", en: "Search activities...", ja: "活動を検索...", zh: "搜索活动...", ko: "활동 검색...", ru: "Поиск активностей..." },
   "checkPlus.notEnoughPoints": { th: "แต้มไม่พอ", en: "Not enough points", ja: "ポイントが不足", zh: "积分不足", ko: "포인트 부족", ru: "Недостаточно баллов" },
   "checkPlus.notEnoughPointsDesc": { th: "ใส่โค้ด user ในหน้าตั้งค่าเพื่อรับแต้ม", en: "Enter a user code in Settings to earn points", ja: "設定でユーザーコードを入力してポイントを獲得", zh: "在设置中输入用户代码以获得积分", ko: "설정에서 사용자 코드를 입력하여 포인트 획득", ru: "Введите код пользователя в настройках для получения баллов" },
   "checkPlus.loginRequired": { th: "กรุณาเข้าสู่ระบบ", en: "Please log in", ja: "ログインしてください", zh: "请登录", ko: "로그인해주세요", ru: "Пожалуйста, войдите" },
   "checkPlus.success": { th: "Check Plus สำเร็จ! ✅", en: "Check Plus Success! ✅", ja: "チェックプラス成功！✅", zh: "Check Plus 成功！✅", ko: "Check Plus 성공! ✅", ru: "Check Plus выполнен! ✅" },
   "checkPlus.expFor": { th: "+10 EXP สำหรับ", en: "+10 EXP for", ja: "+10 EXP（", zh: "+10 EXP 用于", ko: "+10 EXP -", ru: "+10 EXP за" },
   "checkPlus.error": { th: "เกิดข้อผิดพลาด", en: "An error occurred", ja: "エラーが発生しました", zh: "发生错误", ko: "오류 발생", ru: "Произошла ошибка" },
   "checkPlus.cannotCheckin": { th: "ไม่สามารถเช็คอินได้", en: "Cannot check in", ja: "チェックインできません", zh: "无法签到", ko: "체크인할 수 없습니다", ru: "Не удалось отметиться" },

   // Fast Check-in
   "fastCheckin.description": { th: "สำหรับคนที่ทำกิจกรรมคนเดียว เช่น ออกไปวิ่งคนเดียว อ่านหนังสือก่อนนอน ก็สามารถเก็บแต้มเพิ่มเติมตรงนี้ได้ (ไม่เกี่ยวกับการเช็คอินในกิจกรรม)", en: "For solo activities like running alone or reading before bed — earn extra points here (separate from group activity check-ins)", ja: "一人で行う活動（一人でジョギング、就寝前の読書など）のポイントをここで獲得できます（グループ活動のチェックインとは別）", zh: "适合独自进行的活动，如独自跑步、睡前读书——在此获得额外积分（与活动签到无关）", ko: "혼자 하는 활동(혼자 달리기, 자기 전 독서 등)의 포인트를 여기서 획득하세요 (그룹 활동 체크인과 별개)", ru: "Для одиночных активностей — пробежки, чтения перед сном — зарабатывайте дополнительные баллы здесь (отдельно от групповых чекинов)" },
   "fastCheckin.selectToday": { th: "เลือกกิจกรรมที่ทำวันนี้", en: "Select today's activities", ja: "今日の活動を選択", zh: "选择今天的活动", ko: "오늘의 활동 선택", ru: "Выберите сегодняшние активности" },
   "fastCheckin.remainingCount": { th: "เหลือ {n} ครั้ง", en: "{n} remaining", ja: "残り{n}回", zh: "剩余{n}次", ko: "{n}회 남음", ru: "осталось {n}" },
   "fastCheckin.proOnly": { th: "ฟีเจอร์นี้สำหรับสมาชิก Pro หรือ Gold เท่านั้น", en: "This feature is for Pro or Gold members only", ja: "この機能はProまたはGoldメンバー専用です", zh: "此功能仅适用于 Pro 或 Gold 会员", ko: "이 기능은 Pro 또는 Gold 회원 전용입니다", ru: "Эта функция доступна только для Pro или Gold участников" },
   "fastCheckin.subscribe": { th: "สมัครสมาชิก", en: "Subscribe", ja: "登録する", zh: "订阅", ko: "구독하기", ru: "Подписаться" },
   "fastCheckin.notFound": { th: "ไม่พบกิจกรรมที่ค้นหา", en: "No activities found", ja: "活動が見つかりません", zh: "未找到活动", ko: "활동을 찾을 수 없습니다", ru: "Активности не найдены" },
   "fastCheckin.fullToday": { th: "เช็คอินครบแล้ว", en: "Check-ins complete", ja: "チェックイン完了", zh: "签到已满", ko: "체크인 완료", ru: "Лимит чекинов исчерпан" },
   "fastCheckin.fullTodayDesc": { th: "คุณเช็คอินผ่าน Fast Check-in ครบ 2 ครั้งแล้ววันนี้", en: "You've completed 2 Fast Check-ins today", ja: "本日のFast Check-in 2回を達成しました", zh: "您今天已完成2次快速签到", ko: "오늘 Fast Check-in 2회를 완료했습니다", ru: "Вы выполнили 2 быстрых чекина сегодня" },
   "fastCheckin.alreadyChecked": { th: "เช็คอินไปแล้ว", en: "Already checked in", ja: "チェックイン済み", zh: "已签到", ko: "이미 체크인함", ru: "Уже отмечено" },
   "fastCheckin.alreadyCheckedDesc": { th: "คุณเช็คอินกิจกรรมนี้ไปแล้ววันนี้", en: "You've already checked in this activity today", ja: "本日この活動はチェックイン済みです", zh: "您今天已经签到了此活动", ko: "오늘 이미 이 활동을 체크인했습니다", ru: "Вы уже отметились в этой активности сегодня" },
   "fastCheckin.loginRequiredDesc": { th: "คุณต้องเข้าสู่ระบบก่อนเช็คอิน", en: "You must log in before checking in", ja: "チェックイン前にログインしてください", zh: "签到前请先登录", ko: "체크인 전에 로그인해야 합니다", ru: "Войдите перед тем, как отмечаться" },
   "fastCheckin.success": { th: "เช็คอินสำเร็จ! ⚡", en: "Check-in successful! ⚡", ja: "チェックイン成功！⚡", zh: "签到成功！⚡", ko: "체크인 성공! ⚡", ru: "Чекин выполнен! ⚡" },
   "fastCheckin.expFor": { th: "+10 EXP สำหรับ", en: "+10 EXP for", ja: "+10 EXP（", zh: "+10 EXP 用于", ko: "+10 EXP -", ru: "+10 EXP за" },
   "fastCheckin.error": { th: "เกิดข้อผิดพลาด", en: "An error occurred", ja: "エラーが発生しました", zh: "发生错误", ko: "오류 발생", ru: "Произошла ошибка" },
   "fastCheckin.cannotCheckin": { th: "ไม่สามารถเช็คอินได้", en: "Cannot check in", ja: "チェックインできません", zh: "无法签到", ko: "체크인할 수 없습니다", ru: "Не удалось отметиться" },

   // Reels Search
   "reelsSearch.placeholder": { th: "ค้นหาวิดีโอ ผู้ใช้...", en: "Search videos, users...", ja: "動画、ユーザーを検索...", zh: "搜索视频、用户...", ko: "동영상, 사용자 검색...", ru: "Поиск видео, пользователей..." },
   "reelsSearch.reelsTab": { th: "วิดีโอ", en: "Videos", ja: "動画", zh: "视频", ko: "동영상", ru: "Видео" },
   "reelsSearch.usersTab": { th: "ผู้ใช้", en: "Users", ja: "ユーザー", zh: "用户", ko: "사용자", ru: "Пользователи" },
   "reelsSearch.searchFor": { th: "ค้นหา \"{q}\"", en: "Search \"{q}\"", ja: "「{q}」を検索", zh: "搜索 \"{q}\"", ko: "\"{q}\" 검색", ru: "Искать \"{q}\"" },
   "reelsSearch.recentSearches": { th: "ค้นหาล่าสุด", en: "Recent searches", ja: "最近の検索", zh: "最近搜索", ko: "최근 검색", ru: "Недавние поиски" },
   "reelsSearch.clearAll": { th: "ลบทั้งหมด", en: "Clear all", ja: "すべて削除", zh: "清除全部", ko: "모두 삭제", ru: "Очистить всё" },
   "reelsSearch.trending": { th: "กำลังเป็นที่นิยม", en: "Trending", ja: "トレンド", zh: "热门", ko: "인기 급상승", ru: "В тренде" },
   "reelsSearch.noVideos": { th: "ไม่พบวิดีโอที่ตรงกัน", en: "No matching videos found", ja: "一致する動画が見つかりません", zh: "未找到匹配的视频", ko: "일치하는 동영상이 없습니다", ru: "Видео не найдено" },
   "reelsSearch.noUsers": { th: "ไม่พบผู้ใช้ที่ตรงกัน", en: "No matching users found", ja: "一致するユーザーが見つかりません", zh: "未找到匹配的用户", ko: "일치하는 사용자가 없습니다", ru: "Пользователи не найдены" },
   "reelsSearch.unknownUser": { th: "ผู้ใช้", en: "User", ja: "ユーザー", zh: "用户", ko: "사용자", ru: "Пользователь" },
   "reelsSearch.untitledVideo": { th: "วิดีโอ", en: "Video", ja: "動画", zh: "视频", ko: "동영상", ru: "Видео" },

   // Top Rank
   "topRank.selectCategory": { th: "เลือกกิจกรรมที่แสดง", en: "Select category to display", ja: "表示するカテゴリを選択", zh: "选择显示的类别", ko: "표시할 카테고리 선택", ru: "Выберите категорию" },
   "topRank.noData": { th: "ยังไม่มีข้อมูลอันดับ", en: "No ranking data yet", ja: "ランキングデータがありません", zh: "暂无排名数据", ko: "랭킹 데이터가 없습니다", ru: "Данные рейтинга отсутствуют" },
   "topRank.participants": { th: "ผู้เข้าร่วม", en: "participants", ja: "参加者", zh: "参与者", ko: "참가자", ru: "участников" },
   "topRank.checkins": { th: "เช็คอิน", en: "check-ins", ja: "チェックイン", zh: "签到", ko: "체크인", ru: "чекинов" },
   "topRank.unknownUser": { th: "ผู้ใช้", en: "User", ja: "ユーザー", zh: "用户", ko: "사용자", ru: "Пользователь" },

   // Help Center
   "help.title": { th: "ศูนย์ช่วยเหลือ", en: "Help Center", ja: "ヘルプセンター", zh: "帮助中心", ko: "도움말 센터", ru: "Центр помощи" },
   "help.bannerTitle": { th: "มีคำถามหรือปัญหา?", en: "Have a question or problem?", ja: "ご質問や問題がありますか？", zh: "有问题或疑问？", ko: "질문이나 문제가 있으신가요?", ru: "Есть вопрос или проблема?" },
   "help.bannerSubtitle": { th: "เราพร้อมช่วยเหลือคุณเสมอ", en: "We're always here to help", ja: "いつでもお力になります", zh: "我们随时为您提供帮助", ko: "언제든지 도움을 드립니다", ru: "Мы всегда готовы помочь" },
   "help.faqHeader": { th: "คำถามที่พบบ่อย", en: "Frequently Asked Questions", ja: "よくある質問", zh: "常见问题", ko: "자주 묻는 질문", ru: "Часто задаваемые вопросы" },
   "help.contactHeader": { th: "ติดต่อเรา", en: "Contact Us", ja: "お問い合わせ", zh: "联系我们", ko: "문의하기", ru: "Связаться с нами" },
   "help.emailLabel": { th: "อีเมล", en: "Email", ja: "メール", zh: "电子邮件", ko: "이메일", ru: "Электронная почта" },
   "help.faq1q": { th: "วิธีเปลี่ยนรูปโปรไฟล์", en: "How to change profile picture", ja: "プロフィール写真の変更方法", zh: "如何更改头像", ko: "프로필 사진 변경 방법", ru: "Как изменить фото профиля" },
   "help.faq1a": { th: "ไปที่หน้าโปรไฟล์ แล้วกดปุ่ม 'แก้ไขโปรไฟล์' เพื่ออัปโหลดรูปใหม่", en: "Go to the Profile page and tap 'Edit Profile' to upload a new photo.", ja: "プロフィールページで「プロフィールを編集」をタップして新しい写真をアップロードしてください。", zh: "前往个人资料页，点击「编辑资料」上传新照片。", ko: "프로필 페이지에서 '프로필 편집'을 탭하여 새 사진을 업로드하세요.", ru: "Откройте профиль и нажмите «Редактировать профиль», чтобы загрузить новое фото." },
   "help.faq2q": { th: "วิธีสมัคร Premium", en: "How to subscribe to Premium", ja: "プレミアムへの登録方法", zh: "如何订阅 Premium", ko: "Premium 구독 방법", ru: "Как подписаться на Premium" },
   "help.faq2a": { th: "ไปที่หน้าตั้งค่า แล้วเลือกแผนที่ต้องการในหัวข้อ 'สมัครสมาชิก'", en: "Go to Settings and choose your preferred plan under 'Subscription'.", ja: "設定ページで「サブスクリプション」から希望のプランを選択してください。", zh: "前往设置，在「订阅」中选择所需套餐。", ko: "설정에서 '구독' 항목의 원하는 플랜을 선택하세요.", ru: "Перейдите в настройки и выберите план в разделе «Подписка»." },
   "help.faq3q": { th: "วิธีบล็อกผู้ใช้งาน", en: "How to block a user", ja: "ユーザーのブロック方法", zh: "如何屏蔽用户", ko: "사용자 차단 방법", ru: "Как заблокировать пользователя" },
   "help.faq3a": { th: "เข้าไปที่โปรไฟล์ของผู้ใช้ที่ต้องการบล็อก แล้วกดเมนู ⋮ และเลือก 'บล็อก'", en: "Go to the user's profile, tap the ⋮ menu, and select 'Block'.", ja: "ブロックしたいユーザーのプロフィールで⋮メニューをタップし「ブロック」を選択。", zh: "前往该用户个人资料，点击⋮菜单，选择「屏蔽」。", ko: "차단할 사용자 프로필에서 ⋮ 메뉴를 탭하고 '차단'을 선택하세요.", ru: "Откройте профиль пользователя, нажмите ⋮ и выберите «Заблокировать»." },
   "help.faq4q": { th: "วิธีรายงานเนื้อหาที่ไม่เหมาะสม", en: "How to report inappropriate content", ja: "不適切なコンテンツの報告方法", zh: "如何举报不当内容", ko: "부적절한 콘텐츠 신고 방법", ru: "Как пожаловаться на контент" },
   "help.faq4a": { th: "กดค้างที่โพสต์หรือกดเมนู ⋮ แล้วเลือก 'รายงาน'", en: "Long-press the post or tap the ⋮ menu, then select 'Report'.", ja: "投稿を長押しするか⋮メニューをタップし「報告」を選択してください。", zh: "长按帖子或点击⋮菜单，选择「举报」。", ko: "게시물을 길게 누르거나 ⋮ 메뉴를 탭하고 '신고'를 선택하세요.", ru: "Нажмите и удерживайте пост или нажмите ⋮, выберите «Пожаловаться»." },
   "help.faq5q": { th: "วิธีระงับบัญชี", en: "How to suspend your account", ja: "アカウントの一時停止方法", zh: "如何暂停账户", ko: "계정 정지 방법", ru: "Как приостановить аккаунт" },
   "help.faq5a": { th: "ไปที่หน้าตั้งค่า แล้วเลื่อนลงไปด้านล่างสุด กดปุ่ม 'ระงับบัญชี' และยืนยันการดำเนินการ เมื่อระงับแล้วระบบจะออกจากระบบอัตโนมัติ โปรไฟล์และเนื้อหาของคุณจะถูกซ่อนจากผู้ใช้อื่น หากต้องการกลับมาใช้งานอีกครั้ง เพียงเข้าสู่ระบบตามปกติแล้วกด 'เปิดใช้งานบัญชี'", en: "Go to Settings and scroll to the bottom. Tap 'Suspend Account' and confirm. You will be logged out automatically and your profile will be hidden from others. To reactivate, simply log in again and tap 'Activate Account'.", ja: "設定ページで下にスクロールし「アカウントを一時停止」をタップして確認。自動的にログアウトされ、プロフィールは非表示になります。再開するにはログインして「アカウントを有効化」をタップしてください。", zh: "前往设置并滚动到底部，点击「暂停账户」并确认。系统将自动退出，您的个人资料将对其他人隐藏。重新激活只需登录并点击「激活账户」。", ko: "설정에서 아래로 스크롤하여 '계정 정지'를 탭하고 확인하세요. 자동으로 로그아웃되며 프로필이 숨겨집니다. 재활성화하려면 로그인 후 '계정 활성화'를 탭하세요.", ru: "В настройках прокрутите вниз, нажмите «Приостановить аккаунт» и подтвердите. Вы будете автоматически выйдены, профиль скрыт. Для возобновления войдите и нажмите «Активировать аккаунт»." },

   // Terms of Service
   "terms.pageTitle": { th: "ข้อตกลงและเงื่อนไขการใช้งาน", en: "Terms of Service", ja: "利用規約", zh: "服务条款", ko: "서비스 이용약관", ru: "Условия использования" },
   "terms.updatedAt": { th: "อัปเดตล่าสุด: 18 มกราคม 2568", en: "Last updated: January 18, 2025", ja: "最終更新：2025年1月18日", zh: "最后更新：2025年1月18日", ko: "최종 업데이트: 2025년 1월 18일", ru: "Последнее обновление: 18 января 2025 г." },
   "terms.copyright": { th: "© Levelon. สงวนลิขสิทธิ์.", en: "© Levelon. All rights reserved.", ja: "© Levelon. 全著作権所有。", zh: "© Levelon. 保留所有权利。", ko: "© Levelon. 모든 권리 보유.", ru: "© Levelon. Все права защищены." },
   "terms.copyrightNote": { th: "เอกสารนี้มีผลบังคับใช้กับผู้ใช้งานทุกคน", en: "This document applies to all users.", ja: "この文書はすべてのユーザーに適用されます。", zh: "本文档适用于所有用户。", ko: "이 문서는 모든 사용자에게 적용됩니다.", ru: "Этот документ распространяется на всех пользователей." },
   "terms.s1.title": { th: "1. ข้อตกลงทั่วไป", en: "1. General Terms", ja: "1. 一般規約", zh: "1. 一般条款", ko: "1. 일반 약관", ru: "1. Общие положения" },
   "terms.s1.body": { th: "การเข้าใช้งานแอปพลิเคชันนี้ ถือว่าผู้ใช้งานได้อ่าน ทำความเข้าใจ และยอมรับข้อตกลงและเงื่อนไขการใช้งานทั้งหมด หากผู้ใช้งานไม่ยอมรับเงื่อนไข ไม่สามารถใช้งานแอปพลิเคชันนี้ได้", en: "By using this application, you confirm that you have read, understood, and accepted all terms and conditions. If you do not agree, you may not use this application.", ja: "このアプリケーションを使用することで、すべての利用規約を読み、理解し、同意したことになります。同意されない場合はご利用いただけません。", zh: "使用本应用程序即表示您已阅读、理解并接受所有条款。如不同意，则不得使用本应用程序。", ko: "본 애플리케이션을 사용함으로써 모든 이용약관을 읽고 이해하며 동의한 것으로 간주됩니다. 동의하지 않으면 사용할 수 없습니다.", ru: "Используя приложение, вы подтверждаете, что прочитали и приняли все условия использования. Если вы не согласны, вы не можете использовать приложение." },
   "terms.s2.title": { th: "2. ลักษณะบริการ", en: "2. Nature of Service", ja: "2. サービスの性質", zh: "2. 服务性质", ko: "2. 서비스 특성", ru: "2. Характер услуг" },
   "terms.s2.body": { th: "แอปพลิเคชันนี้เป็นเพียงสื่อกลางสำหรับกิจกรรม การพัฒนาตนเอง และการสร้างสังคมคอมมูนิตี้ (เช่น การ Check-in สะสม EXP, การ Level up, การพูดคุย และการลงคลิป Reels) แอปพลิเคชันไม่ได้มีส่วนเกี่ยวข้องกับการจัดกิจกรรมโดยตรง แต่เป็นเพียงผู้ให้บริการระบบเท่านั้น", en: "This application is a platform for activities, self-development, and community building (e.g., Check-in, EXP accumulation, Level up, chat, and posting Reels). The service provider is not directly involved in organizing activities and serves only as a system provider.", ja: "このアプリはアクティビティ、自己啓発、コミュニティ形成のプラットフォームです（例：チェックイン、EXP蓄積、レベルアップ、チャット、Reels投稿）。サービス提供者はアクティビティの主催に直接関与せず、システム提供者としてのみ機能します。", zh: "本应用程序是活动、自我发展和社区建设的平台（例如：签到、EXP积累、升级、聊天和发布Reels）。服务提供商不直接参与活动组织，仅作为系统提供商。", ko: "본 애플리케이션은 활동, 자기계발, 커뮤니티 구축을 위한 플랫폼입니다(예: 체크인, EXP 적립, 레벨업, 채팅, Reels 게시). 서비스 제공자는 활동 조직에 직접 관여하지 않고 시스템 제공자로만 기능합니다.", ru: "Приложение является платформой для активностей, саморазвития и сообщества (чекины, EXP, повышение уровня, чат, Reels). Поставщик услуг не участвует в организации мероприятий напрямую, выступая только как поставщик системы." },
   "terms.s3.title": { th: "3. หน้าที่และความรับผิดชอบของผู้ใช้งาน", en: "3. User Responsibilities", ja: "3. ユーザーの義務と責任", zh: "3. 用户义务与责任", ko: "3. 사용자 의무 및 책임", ru: "3. Обязанности пользователя" },
   "terms.s3.body": { th: "ผู้ใช้งานตกลงที่จะไม่โพสต์หรือแชร์เนื้อหาที่ผิดกฎหมาย เป็นภัยคุกคาม หรือหลอกลวง ผู้ใช้งานต้องรับผิดชอบต่อความปลอดภัยของตนเองในการเข้าร่วมกิจกรรมต่างๆ ที่เกิดขึ้นผ่านการนัดหมายในแอปพลิเคชัน", en: "Users agree not to post or share illegal, threatening, or fraudulent content. Users are responsible for their own safety when participating in activities arranged through the application.", ja: "ユーザーは、違法、脅迫的、または詐欺的なコンテンツを投稿・共有しないことに同意します。アプリを通じて調整されたアクティビティに参加する際の安全はユーザー自身が責任を負います。", zh: "用户同意不发布或分享违法、威胁性或欺诈性内容。通过本应用安排参与活动时，用户需自行承担安全责任。", ko: "사용자는 불법, 위협적, 또는 사기성 콘텐츠를 게시하거나 공유하지 않기로 동의합니다. 애플리케이션을 통해 약속된 활동 참여 시 안전은 사용자 본인이 책임집니다.", ru: "Пользователи соглашаются не публиковать незаконный, угрожающий или мошеннический контент. Ответственность за безопасность при участии в мероприятиях несёт сам пользователь." },
   "terms.s4.title": { th: "4. การจำกัดความรับผิดชอบ", en: "4. Limitation of Liability", ja: "4. 免責事項", zh: "4. 责任限制", ko: "4. 책임 제한", ru: "4. Ограничение ответственности" },
   "terms.s4.body": { th: "แอปพลิเคชันจะไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดขึ้นจากการใช้งาน หรืออุบัติเหตุที่เกิดขึ้นจากการเข้าร่วมกิจกรรม เนื่องจากเป็นการตัดสินใจโดยอิสระของผู้ใช้งานเอง", en: "The application is not responsible for any damages arising from use, or accidents occurring during activities, as participation is at the user's own discretion.", ja: "アプリは、使用から生じるいかなる損害、またはアクティビティ中に発生した事故についても責任を負いません。参加はユーザー自身の判断によるものです。", zh: "本应用程序对使用过程中造成的任何损害或参与活动时发生的意外事故不承担责任，因为参与是用户的自主决定。", ko: "애플리케이션은 사용으로 인한 어떠한 피해나 활동 참여 중 발생한 사고에 대해 책임지지 않습니다. 참여는 사용자 본인의 자유로운 결정입니다.", ru: "Приложение не несёт ответственности за ущерб от использования или несчастные случаи во время мероприятий, поскольку участие является личным решением пользователя." },
   "terms.s5.title": { th: "5. ทรัพย์สินดิจิทัลในระบบ", en: "5. Digital Assets in the System", ja: "5. システム内のデジタル資産", zh: "5. 系统内的数字资产", ko: "5. 시스템 내 디지털 자산", ru: "5. Цифровые активы в системе" },
   "terms.s5.body": { th: "Level, EXP หรือไอเทมต่างๆ ในระบบถือเป็นกรรมสิทธิ์ของแอปพลิเคชัน ไม่สามารถแลกเปลี่ยนเป็นเงินสดได้", en: "Level, EXP, and other in-app items are the property of the application and have no real monetary value. They cannot be exchanged for cash.", ja: "レベル、EXP、その他のアイテムはアプリの所有物であり、実際の金銭的価値はありません。現金との交換はできません。", zh: "等级、EXP及系统内其他物品均为应用程序所有，不具有实际货币价值，不可兑换为现金。", ko: "레벨, EXP 및 기타 인앱 아이템은 애플리케이션의 재산이며 실제 금전적 가치가 없습니다. 현금으로 교환할 수 없습니다.", ru: "Уровень, EXP и другие внутриигровые предметы являются собственностью приложения и не имеют реальной денежной ценности. Обмен на наличные невозможен." },
   "terms.s6.title": { th: "6. การระงับการใช้งาน", en: "6. Account Suspension", ja: "6. アカウント停止", zh: "6. 账户暂停", ko: "6. 계정 정지", ru: "6. Приостановка аккаунта" },
   "terms.s6.body": { th: "แอปพลิเคชันขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีของผู้ใช้งานที่ละเมิดข้อกำหนดนี้ โดยไม่ต้องแจ้งให้ผู้ใช้งานทราบล่วงหน้า", en: "We reserve the right to suspend or terminate accounts that violate these terms without prior notice.", ja: "当社は、本規約に違反するアカウントを事前の通知なく停止または終了する権利を留保します。", zh: "我们保留暂停或终止违反本条款账户的权利，无需提前通知。", ko: "당사는 이 약관을 위반한 계정을 사전 통지 없이 정지 또는 종료할 권리를 보유합니다.", ru: "Мы оставляем за собой право приостанавливать или удалять аккаунты, нарушающие условия, без предварительного уведомления." },
   "terms.s7.title": { th: "7. การแก้ไขข้อตกลง", en: "7. Amendment of Terms", ja: "7. 規約の改定", zh: "7. 条款修改", ko: "7. 약관 수정", ru: "7. Изменение условий" },
   "terms.s7.body": { th: "แอปพลิเคชันอาจมีการปรับปรุงเปลี่ยนแปลงข้อตกลงนี้ได้ตลอดเวลา โดยจะประกาศให้ผู้ใช้งานทราบผ่านแอปพลิเคชัน", en: "We may update these terms at any time. Changes will be announced through the application.", ja: "当社は随時本規約を改定することがあります。変更はアプリを通じてお知らせします。", zh: "我们可能随时更新这些条款，变更将通过应用程序公告。", ko: "당사는 수시로 약관을 업데이트할 수 있습니다. 변경사항은 애플리케이션을 통해 공지됩니다.", ru: "Мы можем обновлять эти условия в любое время. Изменения будут объявлены в приложении." },

   // Privacy Policy
   "privacy.pageTitle": { th: "นโยบายความเป็นส่วนตัว", en: "Privacy Policy", ja: "プライバシーポリシー", zh: "隐私政策", ko: "개인정보 처리방침", ru: "Политика конфиденциальности" },
   "privacy.updatedAt": { th: "อัปเดตล่าสุด: 22 มีนาคม 2569", en: "Last updated: March 22, 2026", ja: "最終更新：2026年3月22日", zh: "最后更新：2026年3月22日", ko: "최종 업데이트: 2026년 3월 22일", ru: "Последнее обновление: 22 марта 2026 г." },
   "privacy.copyright": { th: "© Levelon. สงวนลิขสิทธิ์.", en: "© Levelon. All rights reserved.", ja: "© Levelon. 全著作権所有。", zh: "© Levelon. 保留所有权利。", ko: "© Levelon. 모든 권리 보유.", ru: "© Levelon. Все права защищены." },
   "privacy.copyrightNote": { th: "เอกสารนี้มีผลบังคับใช้กับผู้ใช้งานทุกคน", en: "This document applies to all users.", ja: "この文書はすべてのユーザーに適用されます。", zh: "本文档适用于所有用户。", ko: "이 문서는 모든 사용자에게 적용됩니다.", ru: "Этот документ распространяется на всех пользователей." },
   "privacy.s1.title": { th: "1. ข้อมูลที่แอปพลิเคชันเก็บรวบรวม", en: "1. Information We Collect", ja: "1. 収集する情報", zh: "1. 我们收集的信息", ko: "1. 수집하는 정보", ru: "1. Собираемая информация" },
   "privacy.s1.body": { th: "แอปพลิเคชันเก็บรวบรวมข้อมูลจากผู้ใช้งานด้วยวิธีต่างๆ ดังนี้\n\nข้อมูลที่ผู้ใช้งานให้โดยตรง: ชื่อที่แสดง, รูปโปรไฟล์, อีเมล, หมายเลขโทรศัพท์, วันเกิด (หากระบุ), คำอธิบายตัวเอง, ข้อมูลกิจกรรม (การเช็คอิน, ความสนใจ, การสร้างกิจกรรม), เนื้อหา Reels (วิดีโอ, คำบรรยาย, หมวดหมู่), ข้อความแชท (กลุ่มและส่วนตัว) และข้อมูลร้านค้า\n\nข้อมูลที่เก็บรวบรวมโดยอัตโนมัติ: ที่อยู่ IP และตำแหน่งโดยประมาณ, ประเภทอุปกรณ์, ระบบปฏิบัติการและเวอร์ชันเบราว์เซอร์, ข้อมูลการใช้งาน (หน้าที่เยี่ยมชม, ระยะเวลาการใช้งาน) และ Push Notification Token (FCM Token)", en: "We collect information from you in several ways:\n\nInformation you provide directly: display name, profile picture, email, phone number, date of birth (if provided), bio, activity data (Check-ins, Interests, activity creation), Reels content (videos, captions, categories), chat messages (group and private), and shop information.\n\nInformation collected automatically: IP address and approximate location, device type, operating system and browser version, usage data (pages visited, session duration), and Push Notification Token (FCM Token).", ja: "お客様から以下の方法で情報を収集します。\n\nお客様が直接提供する情報：表示名、プロフィール写真、メールアドレス、電話番号、生年月日（任意）、自己紹介、アクティビティデータ（チェックイン、興味、アクティビティ作成）、Reelsコンテンツ、チャットメッセージ、ショップ情報。\n\n自動収集される情報：IPアドレスおよびおおよその位置情報、デバイスの種類、OS、ブラウザのバージョン、使用状況データ、プッシュ通知トークン（FCMトークン）。", zh: "我们通过以下方式收集您的信息：\n\n您直接提供的信息：显示名称、头像、电子邮件、电话号码、出生日期（如填写）、简介、活动数据（签到、兴趣、创建活动）、Reels内容、聊天消息和店铺信息。\n\n自动收集的信息：IP地址和大致位置、设备类型、操作系统和浏览器版本、使用数据以及推送通知令牌。", ko: "다음과 같은 방법으로 정보를 수집합니다:\n\n직접 제공하는 정보: 표시 이름, 프로필 사진, 이메일, 전화번호, 생년월일(입력 시), 자기소개, 활동 데이터(체크인, 관심사, 활동 생성), Reels 콘텐츠, 채팅 메시지, 상점 정보.\n\n자동 수집 정보: IP 주소 및 대략적인 위치, 기기 유형, OS 및 브라우저 버전, 사용 데이터, 푸시 알림 토큰.", ru: "Мы собираем информацию следующими способами:\n\nПредоставляемая вами напрямую: имя, фото профиля, email, номер телефона, дата рождения (при указании), описание, данные активностей, контент Reels, сообщения чата, данные магазина.\n\nСобираемая автоматически: IP-адрес и примерное местоположение, тип устройства, ОС и браузер, данные использования, токен push-уведомлений." },
   "privacy.s2.title": { th: "2. วัตถุประสงค์การใช้ข้อมูล", en: "2. Purpose of Data Use", ja: "2. データ使用目的", zh: "2. 数据使用目的", ko: "2. 데이터 사용 목적", ru: "2. Цели использования данных" },
   "privacy.s2.body": { th: "แอปพลิเคชันใช้ข้อมูลที่เก็บรวบรวมเพื่อวัตถุประสงค์ดังต่อไปนี้\n• การให้บริการ: เพื่อเปิดใช้งานฟีเจอร์ต่างๆ เช่น การเช็คอิน, แชท, Reels, ร้านค้า และการจัดการกิจกรรม\n• การยืนยันตัวตน: เพื่อตรวจสอบและรักษาความปลอดภัยของบัญชีผู้ใช้งาน\n• ระบบ Level/EXP: เพื่อคำนวณคะแนน EXP, ระดับ และการจัดอันดับผู้ใช้งาน\n• การแจ้งเตือน: เพื่อส่งการแจ้งเตือนเกี่ยวกับข้อความ, กิจกรรม และอัปเดตต่างๆ\n• การปรับปรุงบริการ: เพื่อวิเคราะห์การใช้งานและปรับปรุงประสบการณ์ของผู้ใช้งาน\n• ความปลอดภัย: เพื่อตรวจจับและป้องกันการใช้งานที่ไม่เหมาะสม, การฉ้อโกง หรือการละเมิด\n• การปฏิบัติตามกฎหมาย: เพื่อปฏิบัติตามข้อกำหนดทางกฎหมายที่เกี่ยวข้อง", en: "We use the collected information for the following purposes:\n• Service delivery: to enable features like Check-in, chat, Reels, shop, and activity management\n• Identity verification: to verify and maintain the security of user accounts\n• Level/EXP system: to calculate EXP scores, levels, and user rankings\n• Notifications: to send alerts about messages, activities, and updates\n• Service improvement: to analyze usage and improve the user experience\n• Safety: to detect and prevent inappropriate use, fraud, or violations\n• Legal compliance: to fulfill relevant legal requirements", ja: "収集した情報を以下の目的で使用します：\n• サービス提供：チェックイン、チャット、Reels、ショップ、アクティビティ管理などの機能を提供\n• 本人確認：ユーザーアカウントの確認とセキュリティ維持\n• レベル/EXPシステム：EXPスコア、レベル、ユーザーランキングの計算\n• 通知：メッセージ、アクティビティ、重要なアップデートの通知送信\n• サービス改善：使用状況の分析とユーザー体験の向上\n• 安全性：不適切な使用、詐欺、または違反の検出と防止\n• 法的遵守：関連する法的要件の履行", zh: "我们将收集的信息用于以下目的：\n• 提供服务：启用签到、聊天、Reels、商店和活动管理等功能\n• 身份验证：验证和维护用户账户安全\n• 等级/EXP系统：计算EXP积分、等级和用户排名\n• 通知：发送消息、活动和重要更新的提醒\n• 改善服务：分析使用情况，提升用户体验\n• 安全：检测和防止不当使用、欺诈或违规行为\n• 法律合规：履行相关法律要求", ko: "수집된 정보를 다음 목적으로 사용합니다:\n• 서비스 제공: 체크인, 채팅, Reels, 상점, 활동 관리 기능 제공\n• 본인 확인: 사용자 계정 인증 및 보안 유지\n• 레벨/EXP 시스템: EXP 점수, 레벨, 사용자 순위 계산\n• 알림: 메시지, 활동, 중요 업데이트 알림 전송\n• 서비스 개선: 사용 현황 분석 및 사용자 경험 향상\n• 안전: 부적절한 사용, 사기, 위반 감지 및 예방\n• 법적 준수: 관련 법적 요건 이행", ru: "Мы используем собранную информацию для следующих целей:\n• Предоставление услуг: функции чекинов, чата, Reels, магазина, управления активностями\n• Верификация: проверка и защита аккаунтов\n• Система уровней/EXP: расчёт очков, уровней и рейтингов\n• Уведомления: оповещения о сообщениях, активностях и обновлениях\n• Улучшение сервиса: анализ использования для улучшения UX\n• Безопасность: обнаружение и предотвращение нарушений\n• Правовое соответствие: выполнение требований законодательства" },
   "privacy.s3.title": { th: "3. การเปิดเผยข้อมูล", en: "3. Data Disclosure", ja: "3. データの開示", zh: "3. 数据披露", ko: "3. 데이터 공개", ru: "3. Раскрытие данных" },
   "privacy.s3.body": { th: "แอปพลิเคชันอาจเปิดเผยข้อมูลของผู้ใช้งานในกรณีต่อไปนี้\n• ผู้ให้บริการ: เช่น Supabase (ฐานข้อมูลและการยืนยันตัวตน), Stripe (การชำระเงิน) และ Firebase (การแจ้งเตือน)\n• ข้อมูลสาธารณะ: โปรไฟล์, กิจกรรม, Reels และร้านค้าที่ตั้งค่าเป็นสาธารณะจะมองเห็นได้สำหรับผู้ใช้งานคนอื่น\n• ข้อกำหนดทางกฎหมาย: เมื่อมีคำสั่งจากศาลหรือหน่วยงานรัฐบาลที่มีอำนาจ\n• การคุ้มครองสิทธิ: เพื่อปกป้องสิทธิ, ทรัพย์สิน หรือความปลอดภัยของ Levelon และผู้ใช้งาน\n\nแอปพลิเคชันจะไม่ขายข้อมูลส่วนตัวของผู้ใช้งานให้กับบุคคลที่สามเพื่อวัตถุประสงค์ทางการตลาดโดยเด็ดขาด", en: "We may disclose your data in the following cases:\n• Service providers: such as Supabase (database and authentication), Stripe (payments), and Firebase (push notifications)\n• Public data: profile information, activities, Reels, and shops set to public will be visible to other users\n• Legal requirements: when ordered by a court or authorized government agency\n• Rights protection: to protect the rights, property, or safety of Levelon and its users\n\nWe will never sell your personal data to third parties for marketing purposes.", ja: "以下の場合にお客様のデータを開示することがあります：\n• サービスプロバイダー：Supabase（データベース・認証）、Stripe（決済）、Firebase（プッシュ通知）等\n• 公開データ：公開設定されたプロフィール、アクティビティ、Reels、ショップは他のユーザーに表示されます\n• 法的要件：裁判所または権限ある政府機関からの命令があった場合\n• 権利保護：Levelonおよびユーザーの権利、財産、安全を守るため\n\nマーケティング目的でお客様の個人データを第三者に販売することは一切ありません。", zh: "在以下情况下，我们可能会披露您的数据：\n• 服务提供商：如Supabase（数据库和认证）、Stripe（支付）、Firebase（推送通知）\n• 公开数据：设置为公开的个人资料、活动、Reels和店铺将对其他用户可见\n• 法律要求：收到法院或有权政府机构的命令时\n• 权利保护：保护Levelon及用户的权利、财产或安全\n\n我们绝不会将您的个人数据出售给第三方用于营销目的。", ko: "다음 경우에 데이터를 공개할 수 있습니다:\n• 서비스 제공업체: Supabase(데이터베이스 및 인증), Stripe(결제), Firebase(푸시 알림) 등\n• 공개 데이터: 공개로 설정된 프로필, 활동, Reels, 상점은 다른 사용자에게 표시됩니다\n• 법적 요구: 법원 또는 권한 있는 정부 기관의 명령이 있을 때\n• 권리 보호: Levelon 및 사용자의 권리, 재산, 안전 보호\n\n마케팅 목적으로 개인 데이터를 제3자에게 판매하지 않습니다.", ru: "Мы можем раскрывать ваши данные в следующих случаях:\n• Поставщики услуг: Supabase (база данных и аутентификация), Stripe (платежи), Firebase (push-уведомления)\n• Публичные данные: профиль, активности, Reels и магазины, открытые для всех, будут видны другим пользователям\n• Юридические требования: по решению суда или уполномоченного органа\n• Защита прав: для защиты прав, имущества или безопасности Levelon и пользователей\n\nМы никогда не продаём ваши персональные данные третьим лицам в маркетинговых целях." },
   "privacy.s4.title": { th: "4. การตั้งค่าความเป็นส่วนตัว", en: "4. Privacy Settings", ja: "4. プライバシー設定", zh: "4. 隐私设置", ko: "4. 개인정보 설정", ru: "4. Настройки конфиденциальности" },
   "privacy.s4.body": { th: "ผู้ใช้งานสามารถควบคุมความเป็นส่วนตัวผ่านการตั้งค่าในแอปพลิเคชัน ดังนี้\n• กิจกรรม: เลือกระหว่างสาธารณะ (มองเห็นได้สำหรับทุกคน) หรือส่วนตัว (เข้าร่วมโดยการส่งคำขอ)\n• การบล็อก: บล็อกผู้ใช้งานที่ไม่ต้องการให้เห็นเนื้อหาหรือติดต่อ\n• การแจ้งเตือน: เปิดหรือปิดการแจ้งเตือนสำหรับแชทกลุ่ม, ข้อความส่วนตัว และกิจกรรม\n• โปรไฟล์: แก้ไขข้อมูลสาธารณะ เช่น ชื่อ, รูปโปรไฟล์ และคำอธิบายตัวเอง\n• การระงับบัญชี: ระงับบัญชีชั่วคราวเพื่อซ่อนโปรไฟล์และเนื้อหาทั้งหมดจากผู้ใช้งานคนอื่น", en: "You can control your privacy through the app settings:\n• Activities: choose between public (visible to all) or private (join by request)\n• Blocking: block users you don't want to see your content or contact you\n• Notifications: enable or disable notifications for group chats, private messages, and activities\n• Profile: edit your public information such as name, profile picture, and bio\n• Account suspension: temporarily suspend your account to hide all your profile and content from other users", ja: "アプリの設定からプライバシーを管理できます：\n• アクティビティ：公開（全員に表示）またはプライベート（参加リクエスト制）を選択\n• ブロック：コンテンツを見せたくないユーザーやあなたに連絡してほしくないユーザーをブロック\n• 通知：グループチャット、プライベートメッセージ、アクティビティの通知のオン/オフを切り替え\n• プロフィール：名前、プロフィール写真、自己紹介などの公開情報を編集\n• アカウント一時停止：プロフィールとすべてのコンテンツを他のユーザーに非表示にするため一時停止", zh: "您可以通过应用设置控制隐私：\n• 活动：选择公开（所有人可见）或私密（需申请加入）\n• 屏蔽：屏蔽您不希望看到您内容或联系您的用户\n• 通知：开启或关闭群聊、私信和活动的通知\n• 个人资料：编辑公开信息，如姓名、头像和简介\n• 账户暂停：临时暂停账户，将所有个人资料和内容对其他用户隐藏", ko: "앱 설정을 통해 개인정보를 관리할 수 있습니다:\n• 활동: 공개(모든 사람에게 표시) 또는 비공개(참여 요청 필요) 선택\n• 차단: 콘텐츠를 보여주고 싶지 않거나 연락을 원하지 않는 사용자 차단\n• 알림: 그룹 채팅, 개인 메시지, 활동 알림 켜기/끄기\n• 프로필: 이름, 프로필 사진, 자기소개 등 공개 정보 편집\n• 계정 정지: 프로필과 모든 콘텐츠를 다른 사용자에게 숨기기 위해 임시 정지", ru: "Вы можете управлять конфиденциальностью через настройки приложения:\n• Активности: выбор между публичным (виден всем) и приватным (по заявке)\n• Блокировка: блокировка пользователей, которых вы не хотите видеть\n• Уведомления: включение/отключение уведомлений для чатов, личных сообщений и активностей\n• Профиль: редактирование публичной информации (имя, фото, описание)\n• Приостановка аккаунта: временное скрытие профиля и контента от других пользователей" },
   "privacy.s5.title": { th: "5. สิทธิของผู้ใช้งาน", en: "5. User Rights", ja: "5. ユーザーの権利", zh: "5. 用户权利", ko: "5. 사용자 권리", ru: "5. Права пользователей" },
   "privacy.s5.body": { th: "ภายใต้กฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) และกฎหมายที่เกี่ยวข้อง ผู้ใช้งานมีสิทธิดังต่อไปนี้\n• สิทธิในการเข้าถึง: ขอดูข้อมูลส่วนตัวที่แอปพลิเคชันจัดเก็บไว้\n• สิทธิในการแก้ไข: แก้ไขข้อมูลที่ไม่ถูกต้องหรือล้าสมัยผ่านการตั้งค่าโปรไฟล์\n• สิทธิในการลบ: ขอลบข้อมูลส่วนตัวและบัญชีผู้ใช้งาน\n• สิทธิในการคัดค้าน: คัดค้านการประมวลผลข้อมูลในบางกรณี\n• สิทธิในการโอนข้อมูล: ขอรับข้อมูลส่วนตัวในรูปแบบที่อ่านได้\n\nเพื่อใช้สิทธิเหล่านี้ กรุณาติดต่อแอปพลิเคชันที่ levelon.app@gmail.com หรือผ่านระบบสนับสนุนในแอปพลิเคชัน แอปพลิเคชันจะตอบกลับภายใน 30 วัน", en: "Under personal data protection law (PDPA) and related laws, you have the following rights:\n• Right of access: request to view your personal data we store\n• Right of rectification: correct inaccurate or outdated data through the profile settings\n• Right of erasure: request deletion of your personal data and user account\n• Right to object: object to the processing of your data in certain cases\n• Right to data portability: request your personal data in a readable format\n\nTo exercise these rights, please contact us at levelon.app@gmail.com or through the in-app Support system. We will respond within 30 days.", ja: "個人データ保護法（PDPA）および関連法の下で、お客様は以下の権利を持ちます：\n• アクセス権：当社が保管するお客様の個人データの閲覧を要求する権利\n• 訂正権：プロフィール設定から不正確または古いデータを修正する権利\n• 削除権：個人データとユーザーアカウントの削除を要求する権利\n• 異議申立権：特定の場合においてデータ処理に異議を申し立てる権利\n• データポータビリティの権利：読み取り可能な形式で個人データを要求する権利\n\nこれらの権利を行使するには、levelon.app@gmail.com またはアプリ内サポートシステムからご連絡ください。30日以内に対応します。", zh: "根据个人数据保护法（PDPA）及相关法律，您享有以下权利：\n• 访问权：要求查看我们存储的您的个人数据\n• 更正权：通过个人资料设置更正不正确或过时的数据\n• 删除权：要求删除个人数据和用户账户\n• 反对权：在某些情况下反对数据处理\n• 数据可携带权：以可读格式要求提供个人数据\n\n如需行使上述权利，请通过 levelon.app@gmail.com 或应用内支持系统联系我们，我们将在30天内处理。", ko: "개인정보 보호법(PDPA) 및 관련 법률에 따라 다음 권리를 갖습니다:\n• 접근권: 보관 중인 개인정보 열람 요청\n• 정정권: 프로필 설정에서 부정확하거나 오래된 데이터 수정\n• 삭제권: 개인정보 및 사용자 계정 삭제 요청\n• 이의제기권: 특정 경우 데이터 처리에 이의 제기\n• 데이터 이동권: 읽기 가능한 형식으로 개인정보 요청\n\n권리 행사를 위해 levelon.app@gmail.com 또는 인앱 지원 시스템으로 연락하세요. 30일 이내에 처리합니다.", ru: "По законодательству о защите персональных данных (PDPA) вы имеете следующие права:\n• Право доступа: запросить просмотр ваших данных\n• Право на исправление: исправить неточные данные через настройки профиля\n• Право на удаление: запросить удаление данных и аккаунта\n• Право на возражение: возражать против обработки данных в отдельных случаях\n• Право на переносимость: получить данные в читаемом формате\n\nДля реализации прав обращайтесь на levelon.app@gmail.com или через поддержку в приложении. Мы ответим в течение 30 дней." },
   "privacy.s6.title": { th: "6. ความปลอดภัย", en: "6. Security", ja: "6. セキュリティ", zh: "6. 安全性", ko: "6. 보안", ru: "6. Безопасность" },
   "privacy.s6.body": { th: "แอปพลิเคชันมุ่งมั่นปกป้องข้อมูลของผู้ใช้งานด้วยมาตรการความปลอดภัยที่เข้มงวด\n• การเข้ารหัส: ข้อมูลทั้งหมดถูกเข้ารหัสระหว่างการส่ง (TLS/SSL) และจัดเก็บอย่างปลอดภัย\n• การยืนยันตัวตน: ระบบการยืนยันตัวตนมาตรฐานอุตสาหกรรมที่รองรับ Email/Password และ OAuth (Google)\n• Row Level Security: ฐานข้อมูลใช้ RLS เพื่อให้ผู้ใช้งานเข้าถึงได้เฉพาะข้อมูลที่ได้รับอนุญาตเท่านั้น\n• การกลั่นกรองเนื้อหา: ระบบกลั่นกรองเนื้อหาเพื่อกรองเนื้อหาที่ไม่เหมาะสม\n• การรายงาน: ผู้ใช้งานสามารถรายงานเนื้อหาหรือบัญชีที่ละเมิดข้อกำหนดได้ทันที\n\nแม้แอปพลิเคชันจะใช้มาตรการที่เหมาะสม แต่ไม่มีระบบใดที่ปลอดภัย 100% ผู้ใช้งานควรปกป้องรหัสผ่านและไม่แชร์ข้อมูลการเข้าสู่ระบบกับผู้อื่น", en: "We are committed to protecting your data with strict security measures:\n• Encryption: all data is encrypted in transit (TLS/SSL) and stored securely\n• Authentication: industry-standard authentication system supporting Email/Password and OAuth (Google)\n• Row Level Security: the database uses RLS to ensure users can only access authorized data\n• Content moderation: a content moderation system to filter inappropriate content\n• Reporting: users can immediately report content or accounts that violate the terms\n\nAlthough we take appropriate measures, no system is 100% secure. You should protect your password and not share your login credentials with others.", ja: "お客様のデータを厳格なセキュリティ対策で保護することに努めています：\n• 暗号化：すべてのデータは転送時（TLS/SSL）に暗号化され、安全に保管されます\n• 認証：メール/パスワードおよびOAuth（Google）をサポートする業界標準の認証システム\n• 行レベルセキュリティ：データベースはRLSを使用して、許可されたデータのみアクセス可能に\n• コンテンツモデレーション：不適切なコンテンツを除外するシステム\n• 報告：ユーザーは違反コンテンツやアカウントをすぐに報告できます\n\n適切な措置を講じていますが、100%安全なシステムはありません。パスワードを保護し、ログイン情報を他者と共有しないでください。", zh: "我们致力于通过严格的安全措施保护您的数据：\n• 加密：所有数据在传输过程中（TLS/SSL）均已加密并安全存储\n• 身份验证：支持电子邮件/密码和OAuth（Google）的行业标准认证系统\n• 行级安全：数据库使用RLS确保用户只能访问授权数据\n• 内容审核：过滤不当内容的内容审核系统\n• 举报：用户可以立即举报违规内容或账户\n\n尽管我们采取了适当措施，但没有任何系统是100%安全的。请保护好密码，不要与他人分享登录凭据。", ko: "엄격한 보안 조치로 데이터를 보호합니다:\n• 암호화: 모든 데이터는 전송 중(TLS/SSL) 암호화되어 안전하게 저장됩니다\n• 인증: 이메일/비밀번호 및 OAuth(Google)를 지원하는 업계 표준 인증 시스템\n• 행 수준 보안: 데이터베이스는 RLS를 사용하여 사용자가 허가된 데이터만 접근 가능\n• 콘텐츠 모더레이션: 부적절한 콘텐츠를 필터링하는 시스템\n• 신고: 사용자는 위반 콘텐츠나 계정을 즉시 신고 가능\n\n적절한 조치를 취하지만 100% 안전한 시스템은 없습니다. 비밀번호를 보호하고 로그인 정보를 타인과 공유하지 마세요.", ru: "Мы защищаем ваши данные строгими мерами безопасности:\n• Шифрование: все данные шифруются при передаче (TLS/SSL) и хранятся защищённо\n• Аутентификация: отраслевые стандарты, поддержка Email/Password и OAuth (Google)\n• Безопасность на уровне строк (RLS): пользователи имеют доступ только к разрешённым данным\n• Модерация контента: система фильтрации неприемлемого контента\n• Жалобы: пользователи могут немедленно сообщить о нарушениях\n\nНесмотря на принятые меры, ни одна система не защищена на 100%. Защищайте пароль и не делитесь учётными данными." },
   "privacy.s7.title": { th: "7. ความปลอดภัยของเด็ก", en: "7. Child Safety", ja: "7. 子どもの安全", zh: "7. 儿童安全", ko: "7. 아동 안전", ru: "7. Безопасность детей" },
   "privacy.s7.body": { th: "แอปพลิเคชันมีนโยบายไม่ยอมรับเนื้อหาใดๆ ที่เกี่ยวข้องกับการล่วงละเมิดทางเพศและการแสวงหาประโยชน์จากเด็ก (CSAE) หรือสื่อลามกเด็ก (CSAM) อย่างเด็ดขาด ซึ่งรวมถึงแต่ไม่จำกัดเพียง: เนื้อหาหรือพฤติกรรมที่แสวงหาประโยชน์ทางเพศจากเด็ก, การล่อลวงผู้เยาว์, การค้ามนุษย์เด็กเพื่อวัตถุประสงค์ทางเพศ, การแชร์หรือจัดเก็บสื่อการล่วงละเมิด และการกลั่นแกล้งหรือคุกคามผู้เยาว์\n\nมาตรการของแอปพลิเคชัน: ผู้ใช้งานสามารถรายงานเนื้อหาหรือพฤติกรรมที่ไม่เหมาะสมผ่านระบบรายงานในแอปพลิเคชัน หรือส่งอีเมลมาที่ levelon.app@gmail.com เนื้อหาที่ละเมิดจะถูกลบทันทีและบัญชีที่กระทำผิดจะถูกระงับถาวร คดีจะถูกรายงานต่อเจ้าหน้าที่และองค์กร เช่น NCMEC ตามที่กฎหมายกำหนด\n\nแอปพลิเคชันนี้ไม่อนุญาตให้ผู้ใช้งานที่มีอายุต่ำกว่า 13 ปีลงทะเบียน หากพบผู้ใช้งานที่มีอายุต่ำกว่าเกณฑ์ขั้นต่ำ บัญชีจะถูกระงับทันที", en: "Levelon has a zero-tolerance policy for any content related to child sexual abuse and exploitation (CSAE) or child sexual abuse material (CSAM), including but not limited to: sexually exploitative content or behaviour towards children, grooming minors, child trafficking for sexual purposes, sharing or storing abusive material, and bullying or threatening minors.\n\nOur measures: users can report inappropriate content or behaviour through the in-app report system or by emailing levelon.app@gmail.com. Violating content will be removed immediately and offending accounts permanently suspended. Cases will be reported to law enforcement and organizations such as NCMEC as required by law. A content moderation system is in place to prevent the spread of inappropriate material.\n\nThis application does not allow users under the age of 13 to register. If a user is found to be below the minimum age, the account will be suspended immediately.", ja: "Levelonは、児童性的虐待・搾取（CSAE）や児童性的虐待素材（CSAM）に関するいかなるコンテンツも絶対に許容しません。これには、子どもへの性的搾取的なコンテンツや行動、未成年者へのグルーミング、性的目的の児童売買、虐待素材の共有・保管、未成年者のいじめや脅迫が含まれます。\n\n当社の対策：ユーザーはアプリ内の報告システムまたは levelon.app@gmail.com 宛のメールで不適切なコンテンツや行動を報告できます。違反コンテンツは即座に削除され、違反アカウントは永久停止されます。法律に従い、NCMECなどの機関および法執行機関に事案を報告します。\n\nこのアプリは13歳未満のユーザーの登録を許可しません。最低年齢以下のユーザーが発見された場合、そのアカウントは即座に停止されます。", zh: "Levelon对任何形式的儿童性虐待和剥削（CSAE）或儿童性虐待材料（CSAM）持零容忍政策，包括但不限于：对儿童的性剥削内容或行为、对未成年人的诱骗、以性为目的的儿童贩卖、分享或存储虐待材料，以及恐吓或骚扰未成年人。\n\n我们的措施：用户可通过应用内举报系统或发送电子邮件至 levelon.app@gmail.com 举报不当内容或行为。违规内容将立即删除，违规账户将被永久封禁。根据法律要求，相关案例将向执法机构和NCMEC等组织举报。\n\n本应用不允许13岁以下用户注册。如发现用户年龄低于最低年龄要求，该账户将立即被暂停。", ko: "Levelon은 아동 성 학대 및 착취(CSAE) 또는 아동 성 학대 자료(CSAM)와 관련된 모든 콘텐츠에 대해 무관용 정책을 적용합니다. 아동에 대한 성적 착취 콘텐츠나 행동, 미성년자 그루밍, 성적 목적의 아동 인신매매, 학대 자료 공유 또는 저장, 미성년자 괴롭힘 또는 협박이 포함됩니다.\n\n당사 조치: 사용자는 인앱 신고 시스템 또는 levelon.app@gmail.com으로 부적절한 콘텐츠나 행동을 신고할 수 있습니다. 위반 콘텐츠는 즉시 삭제되고 위반 계정은 영구 정지됩니다. 법률에 따라 NCMEC 등 기관 및 법 집행 기관에 사례를 보고합니다.\n\n본 애플리케이션은 13세 미만 사용자의 가입을 허용하지 않습니다. 최소 연령 미만 사용자가 발견되면 즉시 계정이 정지됩니다.", ru: "Levelon придерживается политики нулевой терпимости к любым материалам, связанным с сексуальным насилием и эксплуатацией детей (CSAE/CSAM), включая: сексуально эксплуататорский контент в отношении детей, грумминг несовершеннолетних, торговлю детьми в сексуальных целях, распространение или хранение материалов о насилии, запугивание или угрозы в адрес несовершеннолетних.\n\nНаши меры: пользователи могут сообщать о нарушениях через систему жалоб в приложении или по адресу levelon.app@gmail.com. Нарушающий контент удаляется немедленно, аккаунты нарушителей блокируются навсегда. Случаи передаются в правоохранительные органы и организации, такие как NCMEC.\n\nПриложение не допускает регистрацию пользователей моложе 13 лет. При обнаружении пользователя ниже минимального возраста аккаунт немедленно блокируется." },
   "privacy.s8.title": { th: "8. การเปลี่ยนแปลงนโยบาย", en: "8. Policy Changes", ja: "8. ポリシーの変更", zh: "8. 政策变更", ko: "8. 정책 변경", ru: "8. Изменения политики" },
   "privacy.s8.body": { th: "แอปพลิเคชันอาจอัปเดตนโยบายความเป็นส่วนตัวนี้เป็นระยะๆ เพื่อให้สอดคล้องกับการเปลี่ยนแปลงของบริการและกฎหมายที่เกี่ยวข้อง\n• การเปลี่ยนแปลงจะมีผลทันทีเมื่อประกาศในแอปพลิเคชัน\n• การเปลี่ยนแปลงที่สำคัญจะแจ้งให้ผู้ใช้งานทราบผ่านแอปพลิเคชัน\n• การใช้งานต่อเนื่องหลังจากการเปลี่ยนแปลงถือว่าผู้ใช้งานยอมรับนโยบายที่อัปเดตแล้ว\n• ผู้ใช้งานสามารถตรวจสอบวันที่อัปเดตล่าสุดได้ที่ด้านบนของหน้านี้\n\nหากผู้ใช้งานมีคำถามเกี่ยวกับนโยบายนี้ กรุณาติดต่อแอปพลิเคชันที่ levelon.app@gmail.com", en: "We may periodically update this Privacy Policy to keep pace with changes in our services and applicable laws:\n• Changes take effect immediately upon announcement in the application\n• Significant changes will be notified to users through the application\n• Continued use after changes indicates acceptance of the updated policy\n• You can check the last updated date at the top of this page\n\nIf you have questions about this policy, please contact us at levelon.app@gmail.com.", ja: "サービスおよび関連法の変更に合わせて、このプライバシーポリシーを定期的に更新することがあります：\n• 変更はアプリでの発表と同時に即時有効となります\n• 重要な変更はアプリを通じてユーザーに通知します\n• 変更後の継続使用は改訂後のポリシーへの同意とみなされます\n• 最終更新日はこのページの上部で確認できます\n\nこのポリシーに関するご質問は、levelon.app@gmail.com までお問い合わせください。", zh: "我们可能会定期更新本隐私政策，以跟上服务变化和适用法律的步伐：\n• 变更在应用程序中公告后立即生效\n• 重大变更将通过应用程序通知用户\n• 变更后继续使用即表示接受更新后的政策\n• 您可以在本页顶部查看最后更新日期\n\n如对本政策有任何疑问，请通过 levelon.app@gmail.com 联系我们。", ko: "서비스 변경 및 관련 법률에 맞춰 이 개인정보 처리방침을 주기적으로 업데이트할 수 있습니다:\n• 변경사항은 애플리케이션 공지 즉시 효력이 발생합니다\n• 중요한 변경사항은 애플리케이션을 통해 사용자에게 알립니다\n• 변경 후 계속 사용하면 업데이트된 정책에 동의한 것으로 간주됩니다\n• 이 페이지 상단에서 마지막 업데이트 날짜를 확인할 수 있습니다\n\n이 정책에 대한 질문은 levelon.app@gmail.com으로 문의하세요.", ru: "Мы можем периодически обновлять эту политику в соответствии с изменениями в сервисе и законодательстве:\n• Изменения вступают в силу сразу после объявления в приложении\n• О существенных изменениях пользователи будут уведомлены через приложение\n• Продолжение использования после изменений означает принятие обновлённой политики\n• Дату последнего обновления можно найти в верхней части этой страницы\n\nПо вопросам, связанным с этой политикой, обращайтесь на levelon.app@gmail.com." },
};

/** Extract all English strings from the translations object */
const getEnglishStrings = (): Record<string, string> =>
  Object.fromEntries(
    Object.entries(translations)
      .map(([k, v]) => [k, v["en"] ?? ""])
      .filter(([, v]) => v)
  );

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return localStorage.getItem("app_language") ?? "th";
  });

  // Dynamic translations for unsupported languages (fetched from API + cached)
  const [dynamicStrings, setDynamicStrings] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("app_language") ?? "th";
    if (hasNativeTranslation(saved)) return {};
    return loadCachedTranslations(saved) ?? {};
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState(0);

  // When language changes, load or fetch translations for unsupported languages
  useEffect(() => {
    if (hasNativeTranslation(language)) {
      setDynamicStrings({});
      return;
    }

    // Try cache first
    const cached = loadCachedTranslations(language);
    if (cached) {
      setDynamicStrings(cached);
      return;
    }

    // Fetch from API
    setIsTranslating(true);
    setTranslateProgress(0);
    translateAllStrings(getEnglishStrings(), language, (p) => setTranslateProgress(p))
      .then((result) => {
        saveCachedTranslations(language, result);
        setDynamicStrings(result);
      })
      .finally(() => {
        setIsTranslating(false);
        setTranslateProgress(1);
      });
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  };

  const t = (key: string): string => {
    const entry = translations[key];
    // For native languages: use hardcoded translation
    if (entry?.[language]) return entry[language];
    // For dynamic languages: use auto-translated string
    if (dynamicStrings[key]) return dynamicStrings[key];
    // Fallback: English → key
    return entry?.["en"] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isTranslating, translateProgress }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
