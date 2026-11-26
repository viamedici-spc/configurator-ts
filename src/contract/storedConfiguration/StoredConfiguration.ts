import type {StoredConfigurationV1} from "./StoredConfigurationV1";

/**
 * A configuration stored by `IConfigurationSession.storeConfiguration` and restored by `restoreConfiguration`, in any
 * schema version the library can read.
 */
export type StoredConfiguration = StoredConfigurationV1;