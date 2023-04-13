import { defineStore } from "pinia";
import { shallowRef, watch } from "vue";
import { guessSimilarityThreshold } from "@/api/utils";
import {
  useFileStore,
  useKgramStore,
  useMetadataStore,
  usePairStore,
} from "@/api/stores";
import { refDebounced } from "@vueuse/shared";

/**
 * Store managing the API.
 */
export const useApiStore = defineStore("api", () => {
  // API Stores
  const fileStore = useFileStore();
  const kgramStore = useKgramStore();
  const metadataStore = useMetadataStore();
  const pairStore = usePairStore();

  // If the data is loaded.
  const isLoaded = shallowRef(false);
  // Loading text.
  const loadingText = shallowRef("Loading...");

  // Whether the names should be anonymized.
  const isAnonymous = shallowRef(false);

  // Cut-off value.
  const cutoff = shallowRef(0.75);
  const cutoffDefault = shallowRef(0.75);
  const cutoffDebounced = refDebounced(cutoff, 100);

  // Hydrate the API stores.
  const hydrate = async (url?: string): Promise<void> => {
    isLoaded.value = false;

    // Hydrate all stores (fetch data)
    loadingText.value = "Fetching & parsing files...";
    await fileStore.hydrate(url);
    loadingText.value = "Fetching & parsing k-grams...";
    await kgramStore.hydrate(url);
    loadingText.value = "Fetching & parsing metadata...";
    await metadataStore.hydrate(url);
    loadingText.value = "Fetching & parsing pairs...";
    await pairStore.hydrate(url);

    // Calculate the initial cut-off value.
    loadingText.value = "Calculating initial cut-off...";
    cutoff.value = guessSimilarityThreshold(pairStore.pairsActiveList);
    cutoffDefault.value = cutoff.value;

    isLoaded.value = true;
  };

  // Re-hydrate the API stores when the anonymous value changes.
  watch(
    isAnonymous,
    () => {
      fileStore.anonymize();
    }
  );

  return {
    isAnonymous,
    isLoaded,
    loadingText,
    cutoff,
    cutoffDefault,
    cutoffDebounced,
    hydrate,
  };
});
