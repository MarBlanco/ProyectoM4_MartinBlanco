import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/es';

// Permite escribir fechas como DD/MM/YYYY en DateInput y localiza el calendario.
dayjs.extend(customParseFormat);
