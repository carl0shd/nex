import Speech
import Foundation

/// Returns the list of locales SFSpeechRecognizer supports on this Mac, sorted
/// to put the system locale at the top, then grouped by language family
/// (English variants together, Spanish variants together, etc.). Inside each
/// family, on-device-capable locales come first.
func handleListLocales(id: String) {
  let allLocales = SFSpeechRecognizer.supportedLocales()
  let displayLocale = Locale.current

  func encode(_ locale: Locale) -> [String: Any] {
    let recognizer = SFSpeechRecognizer(locale: locale)
    let name = displayLocale.localizedString(forIdentifier: locale.identifier) ?? locale.identifier
    return [
      "identifier": locale.identifier,
      "displayName": name,
      "supportsOnDevice": recognizer?.supportsOnDeviceRecognition ?? false
    ]
  }

  func languageCode(_ locale: Locale) -> String {
    locale.language.languageCode?.identifier ?? locale.identifier
  }

  func displayName(for locale: Locale) -> String {
    displayLocale.localizedString(forIdentifier: locale.identifier) ?? locale.identifier
  }

  func onDevice(_ locale: Locale) -> Bool {
    SFSpeechRecognizer(locale: locale)?.supportsOnDeviceRecognition ?? false
  }

  // Find the closest match to the system locale (exact id, else same language family).
  let systemLocale: Locale? = {
    if let exact = allLocales.first(where: { $0.identifier == displayLocale.identifier }) {
      return exact
    }
    let lang = languageCode(displayLocale)
    return allLocales.first { languageCode($0) == lang }
  }()

  // Group remaining by language family.
  let remaining = allLocales.filter { $0 != systemLocale }
  var groups: [String: [Locale]] = [:]
  for locale in remaining {
    groups[languageCode(locale), default: []].append(locale)
  }

  // Sort each group: on-device first, then alphabetical by display name.
  for (key, list) in groups {
    groups[key] = list.sorted { a, b in
      let aOnDevice = onDevice(a)
      let bOnDevice = onDevice(b)
      if aOnDevice != bOnDevice { return aOnDevice }
      return displayName(for: a) < displayName(for: b)
    }
  }

  // Order groups alphabetically by primary language display name.
  let orderedGroupKeys = groups.keys.sorted { lhs, rhs in
    let lhsName = displayLocale.localizedString(forLanguageCode: lhs) ?? lhs
    let rhsName = displayLocale.localizedString(forLanguageCode: rhs) ?? rhs
    return lhsName < rhsName
  }

  var ordered: [Locale] = []
  if let systemLocale { ordered.append(systemLocale) }
  for key in orderedGroupKeys {
    ordered.append(contentsOf: groups[key] ?? [])
  }

  sendResult(id: id, payload: ["locales": ordered.map(encode)])
}
