import { Office031Config, LocalProvider, Extension, DesktopPhoneModel } from '../types';

export function generateProvisionConfig(
  config: Office031Config,
  provider: LocalProvider,
  extensions: Extension[],
  phoneModel: DesktopPhoneModel
): string {
  const timestamp = new Date().toISOString();

  if (phoneModel.configFormat === 'yealink_cfg') {
    return `#!version:1.0.0.1
## Yealink Auto-Provisioning Configuration File
## Generated for: ${phoneModel.displayName}
## MAC Address: ${config.deskPhoneMac}
## Timestamp: ${timestamp}
## Provisioned Pilot DID: ${config.formattedInternational} (Local 031 Office Mail Line)

[ Account1 ]
account.1.enable = 1
account.1.label = Office 031 (${config.mainNumber})
account.1.display_name = ${config.callerIdName}
account.1.auth_name = ${provider.authUsername}
account.1.user_name = ${config.mainNumber.replace(/\s+/g, '')}
account.1.sip_server.1.address = ${provider.host}
account.1.sip_server.1.port = ${provider.port}
account.1.sip_server.1.transport_type = ${provider.protocol === 'TLS' ? '2' : '0'}
account.1.codec.g711a.enable = 1
account.1.codec.g729.enable = 1
account.1.codec.opus.enable = 1

## Office Mail (031 Voicemail) & MWI Configuration
voice_mail.number.1 = ${config.voicemailNumber}
account.1.subscribe_mwi = ${config.mwiLampEnabled ? '1' : '0'}
account.1.subscribe_mwi_to_vm = 1
voice_mail.mwi_lamp_enable = 1

## Switchboard Line & Intercom Parameters
intercom.barge.enable = 1
intercom.mute.enable = 0
features.auto_answer.enable = ${config.autoAnswerIntercom ? '1' : '0'}

## Programmable DSS Line Keys (Desk Phone Line 1 assigned to 031 DID)
linekey.1.type = 15
linekey.1.line = 1
linekey.1.value = ${config.mainNumber}
linekey.1.label = 031 Main Pilot

## EXP50 Expansion Module (BLF Keys for Switchboard Console)
${extensions
  .map(
    (ext, i) => `expansion_module.1.key.${i + 1}.type = 16
expansion_module.1.key.${i + 1}.line = 1
expansion_module.1.key.${i + 1}.value = ${ext.extensionNumber}
expansion_module.1.key.${i + 1}.label = Ext ${ext.extensionNumber} - ${ext.name.slice(0, 14)}`
  )
  .join('\n')}

## Network & Local Provider Route
network.static_ip = ${config.deskPhoneIp}
sip.nat_turn.enable = 1
sip.dtmf_type = 2
`;
  }

  if (phoneModel.configFormat === 'grandstream_xml') {
    return `<?xml version="1.0" encoding="UTF-8" ?>
<!-- Grandstream GRP Auto-Provision Configuration -->
<!-- Provisioned for 031 Switchboard Phone [${config.deskPhoneMac}] -->
<gs_cfm version="1.0.0">
  <model>${phoneModel.model}</model>
  <mac>${config.deskPhoneMac}</mac>
  <config version="1.0">
    <!-- Account 1: 031 Office Main DID -->
    <P271>1</P271> <!-- Account 1 Active -->
    <P270>Office 031 Main (${config.mainNumber})</P270> <!-- Account Name -->
    <P47>${provider.host}</P47> <!-- SIP Server Host -->
    <P48>${provider.port}</P48> <!-- SIP Server Port -->
    <P35>${config.mainNumber.replace(/\s+/g, '')}</P35> <!-- SIP User ID -->
    <P36>${provider.authUsername}</P36> <!-- Authenticate ID -->
    
    <!-- Office Mail / Voicemail -->
    <P33>${config.voicemailNumber}</P33> <!-- Voicemail User ID -->
    <P135>1</P135> <!-- Subscribe MWI for 031 Mailbox -->
    
    <!-- BLF Keys (Durban Switchboard Extensions) -->
    ${extensions
      .map(
        (ext, idx) => `<!-- Key ${idx + 1}: ${ext.name} -->
    <P3${30 + idx * 4}>1</P3${30 + idx * 4}> <!-- BLF Mode -->
    <P3${31 + idx * 4}>${ext.extensionNumber}</P3${31 + idx * 4}>
    <P3${32 + idx * 4}>Ext ${ext.extensionNumber}</P3${32 + idx * 4}>`
      )
      .join('\n')}
  </config>
</gs_cfm>`;
  }

  if (phoneModel.configFormat === 'polycom_xml') {
    return `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<!-- Polycom VVX Provisioning Configuration -->
<!-- Device MAC: ${config.deskPhoneMac} | Provisioned 031 Number: ${config.formattedInternational} -->
<PHONE_CONFIG>
  <reg
    reg.1.displayName="${config.callerIdName}"
    reg.1.address="${config.mainNumber.replace(/\s+/g, '')}"
    reg.1.label="031 Pilot (${config.mainNumber})"
    reg.1.server.1.address="${provider.host}"
    reg.1.server.1.port="${provider.port}"
    reg.1.auth.userId="${provider.authUsername}"
  />
  <msg msg.mwi.1.subscribe="${config.mwiLampEnabled ? '1' : '0'}" msg.mwi.1.callBack="${config.voicemailNumber}"/>
  <attendant
    attendant.uri="sip:${config.switchboardExtension}@${provider.host}"
    attendant.reg="1"
  />
  <blf>
    ${extensions
      .map(
        (ext, idx) => `<blf.key.${idx + 1} address="${ext.extensionNumber}" label="Ext ${ext.extensionNumber} ${ext.name}"/>`
      )
      .join('\n    ')}
  </blf>
</PHONE_CONFIG>`;
  }

  // Cisco XML
  return `<?xml version="1.0" encoding="UTF-8"?>
<device>
  <!-- Cisco 8851 Configuration File for 031 Pilot Switchboard -->
  <devicePool>
    <dateTimeSetting>
      <timeZone>South Africa Standard Time</timeZone>
    </dateTimeSetting>
  </devicePool>
  <sipProfile>
    <sipCallFeatures>
      <cnfJoinEnabled>true</cnfJoinEnabled>
      <callForwardURI>*72</callForwardURI>
      <voicemailNumber>${config.voicemailNumber}</voicemailNumber>
    </sipCallFeatures>
    <sipStack>
      <outboundProxy>${provider.host}</outboundProxy>
      <outboundProxyPort>${provider.port}</outboundProxyPort>
    </sipStack>
    <line lineIndex="1">
      <featureID>9</featureID>
      <featureLabel>031 Office (${config.mainNumber})</featureLabel>
      <proxy>${provider.host}</proxy>
      <port>${provider.port}</port>
      <authName>${provider.authUsername}</authName>
      <name>${config.mainNumber.replace(/\s+/g, '')}</name>
      <messageWaitingLampPolicy>primaryLine</messageWaitingLampPolicy>
      <messagesNumber>${config.voicemailNumber}</messagesNumber>
    </line>
  </sipProfile>
</device>`;
}
