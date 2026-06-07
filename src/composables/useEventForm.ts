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
    repeatType: '' as '' | 'weekly' | 'biweekly' | 'monthly',
    endSeriesDate: '',
  });

  const customDates = ref<{ id: number; value: string }[]>([]);

  const datesText = ref('');

  const validated = ref(false);

  const showSeriesOptions = computed(() => form.value.isSeries);

  watch(
    () => form.value.isSeries,
    (val) => {
      if (!val) {
        form.value.repeatType = '';
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
      repeatType: '',
      endSeriesDate: '',
    };
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
