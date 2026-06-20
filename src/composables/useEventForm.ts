import { ref, computed, watch } from 'vue';

export function useEventForm() {
  const form = ref({
    title: '',
    description: '',
    room: '',

    startTime: '',
    endTime: '',

    startDate: '',
    endDate: '',

    isSeries: false,
    frequency: 'WEEKLY' as 'WEEKLY' | 'BIWEEKLY',
    endSeriesDate: '',
    runDuringSchoolHolidays: false,
  });

  const customDates = ref<{ id: number; value: string }[]>([]);

  const datesText = ref('');

  const validated = ref(false);

  const showSeriesOptions = computed(() => form.value.isSeries);

  watch(
    () => form.value.isSeries,
    (val) => {
      if (!val) {
        form.value.frequency = 'WEEKLY';
        form.value.endSeriesDate = '';
        form.value.runDuringSchoolHolidays = false;
      }
    },
  );

  function resetForm() {
    form.value = {
      title: '',
      description: '',
      room: '',

      startTime: '',
      endTime: '',

      startDate: '',
      endDate: '',

      isSeries: false,
      frequency: 'WEEKLY',
      endSeriesDate: '',
      runDuringSchoolHolidays: false,
    };

    validated.value = false;
  }

  return {
    form,

    customDates,
    datesText,

    validated,

    showSeriesOptions,

    resetForm,
  };
}
