# デザインシステム推奨案

## 概要
Vision Matesプロジェクトで使用するデザインシステムについて、TamaguiとNativeWindの比較と推奨案を提示します。

## 🎯 推奨: Tamagui

### 理由
1. **クロスプラットフォーム最適化**: WebとReact Nativeの両方で最適化されたパフォーマンス
2. **型安全性**: TypeScriptファーストの設計
3. **豊富なコンポーネント**: 200以上のプリビルドコンポーネント
4. **テーマシステム**: ダークモード対応が容易
5. **アニメーション**: 高性能なアニメーション機能

### 実装例

#### 1. セットアップ
```bash
# packages/ui/package.json
{
  "dependencies": {
    "@tamagui/core": "^1.74.0",
    "@tamagui/config": "^1.74.0",
    "@tamagui/animations-react-native": "^1.74.0",
    "@tamagui/font-inter": "^1.74.0",
    "@tamagui/theme-base": "^1.74.0",
    "@tamagui/shorthands": "^1.74.0",
    "@tamagui/tokens": "^1.74.0"
  }
}
```

#### 2. テーマ設定
```typescript
// packages/ui/src/tamagui.config.ts
import { createTamagui } from '@tamagui/core'
import { createInterFont } from '@tamagui/font-inter'
import { shorthands } from '@tamagui/shorthands'
import { themes, tokens } from '@tamagui/themes'

const interFont = createInterFont()

const config = createTamagui({
  fonts: {
    heading: interFont,
    body: interFont,
  },
  themes,
  tokens,
  shorthands,
})

export type AppConfig = typeof config
export default config
```

#### 3. コンポーネント実装
```typescript
// packages/ui/src/components/Button.tsx
import { styled } from '@tamagui/core'
import { Button as TamaguiButton } from '@tamagui/core'

export const Button = styled(TamaguiButton, {
  backgroundColor: '$primary',
  borderRadius: '$md',
  paddingHorizontal: '$md',
  paddingVertical: '$sm',
  
  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
      },
      secondary: {
        backgroundColor: '$secondary',
      },
    },
    size: {
      small: {
        paddingHorizontal: '$sm',
        paddingVertical: '$xs',
      },
      large: {
        paddingHorizontal: '$lg',
        paddingVertical: '$md',
      },
    },
  },
  
  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
})
```

#### 4. 使用例
```typescript
// apps/web/app/page.tsx
import { Button, Text, YStack } from '@vision-mates/ui'

export default function HomePage() {
  return (
    <YStack space="$md" padding="$lg">
      <Text fontSize="$lg" fontWeight="bold">
        Welcome to Vision Mates
      </Text>
      <Button onPress={() => console.log('Pressed!')}>
        <Text color="white">Get Started</Text>
      </Button>
    </YStack>
  )
}
```

## 🔄 代替案: NativeWind

### 利点
1. **Tailwind CSS互換**: 既存のTailwind CSS知識を活用可能
2. **軽量**: バンドルサイズが小さい
3. **学習コスト**: Tailwind CSSを知っていれば学習コストが低い

### 欠点
1. **パフォーマンス**: React Nativeでのパフォーマンスが劣る
2. **型安全性**: TypeScriptサポートが限定的
3. **コンポーネント**: プリビルドコンポーネントが少ない

### 実装例
```typescript
// packages/ui/src/components/Button.tsx
import { styled } from 'nativewind'
import { Pressable, Text } from 'react-native'

const StyledPressable = styled(Pressable)
const StyledText = styled(Text)

interface ButtonProps {
  onPress: () => void
  title: string
  variant?: 'primary' | 'secondary'
}

export function Button({ onPress, title, variant = 'primary' }: ButtonProps) {
  return (
    <StyledPressable
      onPress={onPress}
      className={`
        px-4 py-2 rounded-lg
        ${variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}
      `}
    >
      <StyledText className="text-white font-medium text-center">
        {title}
      </StyledText>
    </StyledPressable>
  )
}
```

## 📊 比較表

| 項目 | Tamagui | NativeWind |
|------|---------|------------|
| **クロスプラットフォーム** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **パフォーマンス** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **型安全性** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **学習コスト** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **コンポーネント数** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **テーマシステム** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **アニメーション** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **バンドルサイズ** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🎨 デザイントークン設計

### Tamaguiベースのトークン
```typescript
// packages/ui/src/tokens/index.ts
export const tokens = {
  colors: {
    // ブランドカラー
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      500: '#64748b',
      600: '#475569',
      900: '#0f172a',
    },
    
    // セマンティックカラー
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // 背景・テキスト
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    text: '#0f172a',
    textSecondary: '#64748b',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const
```

## 🚀 移行戦略

### 段階的移行
1. **Phase 1**: 共通コンポーネントのTamagui化
2. **Phase 2**: デザイントークンの統一
3. **Phase 3**: プラットフォーム固有コンポーネントの最適化

### 移行チェックリスト
- [ ] Tamaguiのセットアップ
- [ ] デザイントークンの定義
- [ ] 共通コンポーネントの実装
- [ ] 既存コンポーネントの移行
- [ ] テストの更新
- [ ] ドキュメントの更新

## 📚 参考資料

- [Tamagui公式ドキュメント](https://tamagui.dev/)
- [NativeWind公式ドキュメント](https://www.nativewind.dev/)
- [React Native Web](https://necolas.github.io/react-native-web/)

---

**結論**: Vision Matesプロジェクトでは、クロスプラットフォーム対応とパフォーマンスを重視して**Tamagui**を推奨します。 