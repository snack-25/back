export class DateUtil {
  // 연월일시 포맷팅
  public static formatDate(date: Date): string {
    const locale: Intl.LocalesArgument = 'ko-KR';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul',
      fractionalSecondDigits: 3,
    };
    const datetime: Intl.DateTimeFormat = new Intl.DateTimeFormat(locale, options);
    const formattedDate: string = datetime.format(date);
    return formattedDate.replace(
      /(\d{4})\. (\d{2})\. (\d{2})\. (\d{2}):(\d{2}):(\d{2})\.(\d{3})/,
      '$1/$2/$3 $4:$5:$6.$7',
    );
  }
}
