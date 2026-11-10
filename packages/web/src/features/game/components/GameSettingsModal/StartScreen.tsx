import type { GameSettings, StartScreenMode } from "@razzia/common/types/game"
import { START_SCREEN_MODES, START_SCREEN_TIME } from "@razzia/common/constants"
import NumberField from "@razzia/web/components/forms/NumberField"
import ToggleGroup from "@razzia/web/components/ToggleGroup"
import SettingRow from "@razzia/web/features/game/components/GameSettingsModal/SettingRow"
import { Controller, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

const StartScreen = () => {
  const { control } = useFormContext<GameSettings>()
  const { t } = useTranslation()
  const mode = useWatch({ control, name: "startScreen.mode" })

  return (
    <>
      <Controller
        control={control}
        name="startScreen.mode"
        render={({ field }) => (
          <SettingRow
            label="game:settings.startScreen.label"
            hint="game:settings.startScreen.hint"
          >
            <ToggleGroup<StartScreenMode>
              items={[
                {
                  value: START_SCREEN_MODES.AUTO,
                  label: t("game:settings.startScreen.auto"),
                },
                {
                  value: START_SCREEN_MODES.MANUAL,
                  label: t("game:settings.startScreen.manual"),
                },
              ]}
              value={field.value}
              onChange={field.onChange}
            />
          </SettingRow>
        )}
      />

      {mode === START_SCREEN_MODES.AUTO && (
        <NumberField
          name="startScreen.time"
          label="game:settings.startScreen.time"
          min={START_SCREEN_TIME.MIN}
          max={START_SCREEN_TIME.MAX}
          className="mt-4"
        />
      )}
    </>
  )
}

export default StartScreen
